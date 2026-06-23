import { initializeApp } from "https://www.gstatic.com/firebasejs/10.14.1/firebase-app.js";
import {
  addDoc,
  collection,
  deleteDoc,
  doc,
  getFirestore,
  onSnapshot,
  orderBy,
  query,
  serverTimestamp
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

  const app = initializeApp(config);
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
