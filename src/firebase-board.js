import { getApp, getApps, initializeApp } from "https://www.gstatic.com/firebasejs/10.14.1/firebase-app.js";
import {
  addDoc,
  collection,
  deleteDoc,
  doc,
  getFirestore,
  onSnapshot,
  orderBy,
  query,
  serverTimestamp,
  setDoc
} from "https://www.gstatic.com/firebasejs/10.14.1/firebase-firestore.js";

export function isFirebaseConfigured(config) {
  return Boolean(
    config &&
    config.apiKey &&
    config.projectId &&
    config.appId &&
    !String(config.apiKey).includes("PASTE")
  );
}

export function createGuideBoardClient({
  config,
  collectionName = "guidePosts",
  onPosts,
  onError,
  onStatus
}) {
  if (!isFirebaseConfigured(config)) {
    onStatus?.("local", "Firebase 설정 전: 브라우저 임시 저장 모드");
    return {
      enabled: false,
      async addPost() {
        throw new Error("Firebase 설정이 없습니다.");
      },
      async deletePost() {
        throw new Error("Firebase 설정이 없습니다.");
      },
      unsubscribe() {}
    };
  }

  const app = getFirebaseApp(config);
  const db = getFirestore(app);
  const postsRef = collection(db, collectionName);
  const postsQuery = query(postsRef, orderBy("createdAt", "desc"));

  onStatus?.("connecting", "게시판 서버 연결 중...");

  const unsubscribe = onSnapshot(
    postsQuery,
    (snapshot) => {
      const posts = snapshot.docs.map((item) => normalizeFirestorePost(item.id, item.data()));
      onPosts?.(posts);
      onStatus?.("online", `실시간 게시판 연결됨 · ${posts.length}개 글`);
    },
    (error) => {
      onError?.(error);
      onStatus?.("error", `게시판 연결 실패: ${error.message}`);
    }
  );

  return {
    enabled: true,
    async addPost(post) {
      await addDoc(postsRef, {
        title: post.title,
        content: post.content,
        author: post.author || "익명",
        category: post.category || "기타",
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp()
      });
    },
    async deletePost(id) {
      await deleteDoc(doc(db, collectionName, id));
    },
    unsubscribe
  };
}


export function createManualOverrideClient({
  config,
  collectionName = "weeklyOverrides",
  documentId,
  onManual,
  onError,
  onStatus
}) {
  if (!isFirebaseConfigured(config)) {
    onStatus?.("local", "Firebase 설정 전: 이 브라우저에만 저장됩니다.");
    return {
      enabled: false,
      async saveManual() {
        throw new Error("Firebase 설정이 없습니다.");
      },
      unsubscribe() {}
    };
  }

  const app = getFirebaseApp(config);
  const db = getFirestore(app);
  const manualRef = doc(db, collectionName, documentId || "current");

  onStatus?.("connecting", "수동 보정값 서버 연결 중...");

  const unsubscribe = onSnapshot(
    manualRef,
    (snapshot) => {
      const manual = snapshot.exists()
        ? normalizeFirestoreManual(snapshot.data())
        : null;
      onManual?.(manual);
      onStatus?.("online", manual?.items?.length ? `수동 보정값 ${manual.items.length}건 적용 중` : "수동 보정값 없음");
    },
    (error) => {
      onError?.(error);
      onStatus?.("error", `수동 보정값 연결 실패: ${error.message}`);
    }
  );

  return {
    enabled: true,
    async saveManual(manual) {
      await setDoc(manualRef, {
        date: manual.date || "",
        comparisonTargetDate: manual.comparisonTargetDate || "",
        items: Array.isArray(manual.items) ? manual.items : [],
        updatedAt: serverTimestamp()
      }, { merge: true });
    },
    unsubscribe
  };
}


export function createVirtualLobbyClient({
  config,
  collectionName = "virtualLobby",
  onParticipants,
  onMessages,
  onError,
  onStatus
}) {
  if (!isFirebaseConfigured(config)) {
    onStatus?.("local", "Firebase 설정 전: 이 브라우저에서만 움직이는 데모 모드");
    return {
      enabled: false,
      async upsertParticipant() {
        throw new Error("Firebase 설정이 없습니다.");
      },
      async leave() {
        throw new Error("Firebase 설정이 없습니다.");
      },
      async sendMessage() {
        throw new Error("Firebase 설정이 없습니다.");
      },
      unsubscribe() {}
    };
  }

  const app = getFirebaseApp(config);
  const db = getFirestore(app);
  const participantsRef = collection(db, collectionName, "plaza", "participants");
  const messagesRef = collection(db, collectionName, "plaza", "messages");
  const messagesQuery = query(messagesRef, orderBy("createdAt", "asc"));

  onStatus?.("connecting", "버츄얼 광장 연결 중...");

  const unsubscribeParticipants = onSnapshot(
    participantsRef,
    (snapshot) => {
      const participants = snapshot.docs.map((item) => normalizeVirtualParticipant(item.id, item.data()));
      onParticipants?.(participants);
      onStatus?.("online", `실시간 광장 연결됨 · ${participants.length}명 접속`);
    },
    (error) => {
      onError?.(error);
      onStatus?.("error", `광장 연결 실패: ${error.message}`);
    }
  );

  const unsubscribeMessages = onSnapshot(
    messagesQuery,
    (snapshot) => {
      const messages = snapshot.docs.map((item) => normalizeVirtualMessage(item.id, item.data())).slice(-80);
      onMessages?.(messages);
    },
    (error) => {
      onError?.(error);
    }
  );

  return {
    enabled: true,
    async upsertParticipant(participant) {
      const id = safeDocId(participant.userId);
      await setDoc(doc(participantsRef, id), {
        userId: String(participant.userId || id),
        memberKey: String(participant.memberKey || ""),
        nickname: String(participant.nickname || "익명").slice(0, 30),
        guild: String(participant.guild || "-").slice(0, 30),
        job: String(participant.job || "-").slice(0, 40),
        x: Number(participant.x || 50),
        y: Number(participant.y || 55),
        lastMessage: String(participant.lastMessage || "").slice(0, 120),
        lastSeen: new Date().toISOString(),
        updatedAt: serverTimestamp()
      }, { merge: true });
    },
    async leave(userId) {
      await deleteDoc(doc(participantsRef, safeDocId(userId)));
    },
    async sendMessage(message) {
      await addDoc(messagesRef, {
        userId: String(message.userId || ""),
        nickname: String(message.nickname || "익명").slice(0, 30),
        guild: String(message.guild || "-").slice(0, 30),
        text: String(message.text || "").slice(0, 120),
        createdAt: serverTimestamp()
      });
    },
    unsubscribe() {
      unsubscribeParticipants();
      unsubscribeMessages();
    }
  };
}

function normalizeVirtualParticipant(id, data) {
  return {
    id,
    userId: String(data.userId || id),
    memberKey: String(data.memberKey || ""),
    nickname: String(data.nickname || "익명"),
    guild: String(data.guild || "-"),
    job: String(data.job || "-"),
    x: Number(data.x || 50),
    y: Number(data.y || 55),
    lastMessage: String(data.lastMessage || ""),
    lastSeen: String(data.lastSeen || ""),
    updatedAt: toIsoString(data.updatedAt) || data.updatedAt || ""
  };
}

function normalizeVirtualMessage(id, data) {
  return {
    id,
    userId: String(data.userId || ""),
    nickname: String(data.nickname || "익명"),
    guild: String(data.guild || "-"),
    text: String(data.text || ""),
    createdAt: toIsoString(data.createdAt) || data.createdAt || new Date().toISOString()
  };
}

function safeDocId(value) {
  return String(value || "unknown").replace(/[^a-zA-Z0-9_-]/g, "_").slice(0, 80) || "unknown";
}

function getFirebaseApp(config) {
  return getApps().length ? getApp() : initializeApp(config);
}

function normalizeFirestoreManual(data) {
  return {
    date: String(data.date || ""),
    comparisonTargetDate: String(data.comparisonTargetDate || ""),
    items: Array.isArray(data.items) ? data.items : []
  };
}

function normalizeFirestorePost(id, data) {
  const createdAt = toIsoString(data.createdAt) || data.createdAt || new Date().toISOString();
  const updatedAt = toIsoString(data.updatedAt) || data.updatedAt || createdAt;

  return {
    id,
    title: String(data.title || ""),
    content: String(data.content || ""),
    author: String(data.author || "익명"),
    category: String(data.category || "기타"),
    createdAt,
    updatedAt,
    source: "firebase"
  };
}

function toIsoString(value) {
  if (!value) return "";
  if (typeof value.toDate === "function") {
    return value.toDate().toISOString();
  }
  if (value instanceof Date) {
    return value.toISOString();
  }
  return "";
}
