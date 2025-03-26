let facingMode = "user"; // "environment"で外カメラ、"user"でインカメラ

const cameraVideo = document.getElementById("cameraVideo");
const capturedImage = document.getElementById("capturedImage");

const switchButton = document.getElementById("switchButton");
const takePhotoButton = document.getElementById("takePhotoButton");
const postButton = document.getElementById("postButton");
const retakeButton = document.getElementById("retakeButton");

const dateDisplay = document.getElementById("dateDisplay");
const themeDisplay = document.getElementById("themeDisplay");
const themeSelect = document.getElementById("themeSelect");

// 「チェキ」全体を包む要素
const photoPreview = document.getElementById("photoPreview");

// 撮影した最終画像のBase64を保存する
let finalBase64 = "";

// 1) カメラ起動
function startCamera() {
  navigator.mediaDevices.getUserMedia({ video: { facingMode }, audio: false })
    .then(stream => {
      cameraVideo.srcObject = stream;
      cameraVideo.style.display = "block";
      capturedImage.style.display = "none";
    })
    .catch(err => {
      console.error("カメラ起動エラー:", err);
      alert("カメラが利用できません");
    });
}

// 2) 日付をYYYY.MM.DDで
function getFormattedDate() {
  const now = new Date();
  const y = now.getFullYear();
  const m = String(now.getMonth() + 1).padStart(2, '0');
  const d = String(now.getDate()).padStart(2, '0');
  return `${y}.${m}.${d}`;
}

// 3) ページ読み込み時
window.addEventListener("DOMContentLoaded", () => {
  dateDisplay.textContent = getFormattedDate();
  themeDisplay.textContent = ""; 

  startCamera();

  postButton.style.display = "none";
  retakeButton.style.display = "none";
});

// 4) お題の選択表示
themeSelect.addEventListener("change", () => {
  const val = themeSelect.value;
  const txt = themeSelect.options[themeSelect.selectedIndex].text;
  themeDisplay.textContent = (val === "0") ? "" : txt;
});

// 5) カメラ切り替え
switchButton.addEventListener("click", () => {
  facingMode = (facingMode === "user") ? "environment" : "user";
  if (cameraVideo.srcObject) {
    cameraVideo.srcObject.getTracks().forEach(track => track.stop());
  }
  startCamera();
});

// 6) 撮影ボタン
takePhotoButton.addEventListener("click", async () => {
  if (themeSelect.value === "0") {
    alert("お題を選択してください");
    return;
  }

  // --- (A) まず <video> を Canvas へ描画して<img>に差し替え ---
  // これで <video> をキャプチャ可能な状態に
  const canvas = document.createElement("canvas");
  canvas.width = cameraVideo.videoWidth;
  canvas.height = cameraVideo.videoHeight;
  const ctx = canvas.getContext("2d");
  ctx.drawImage(cameraVideo, 0, 0, canvas.width, canvas.height);

  const videoSnapshotBase64 = canvas.toDataURL("image/png");
  cameraVideo.style.display = "none";
  capturedImage.src = videoSnapshotBase64;
  capturedImage.style.display = "block";

  // --- (B) <video> を静止画にした状態で dom-to-image ---
  try {
    const dataUrl = await domtoimage.toPng(photoPreview);
    finalBase64 = dataUrl; // ここに最終的な「チェキ画像」(日付・お題入り)が入る
    console.log("dom-to-image で撮影成功");
  } catch (err) {
    console.error("チェキDOMキャプチャエラー:", err);
    alert("撮影に失敗しました");
    return;
  }

  // ボタン切り替え
  switchButton.style.display = "none";
  takePhotoButton.style.display = "none";
  postButton.style.display = "inline-block";
  retakeButton.style.display = "inline-block";
});

// 7) 再撮影
retakeButton.addEventListener("click", () => {
  // カメラ再起動
  if (cameraVideo.srcObject) {
    cameraVideo.srcObject.getTracks().forEach(track => track.stop());
  }
  startCamera();

  // ボタン切り替え
  switchButton.style.display = "inline-block";
  takePhotoButton.style.display = "inline-block";
  postButton.style.display = "none";
  retakeButton.style.display = "none";
});

// 8) 投稿
postButton.addEventListener("click", () => {
  const selectedCamp = localStorage.getItem("selectedCamp") || "waseda"; 
  const selectedMentor = localStorage.getItem("selectedMentor") || "共通";
  const themeId = parseInt(themeSelect.value, 10);
  if (!themeId) {
    alert("お題が選択されていません");
    return;
  }

  const postData = {
    place: selectedCamp,
    name: selectedMentor,
    theme: themeId,
    img_link: finalBase64 // 撮影時に生成された「チェキ画像」Base64
  };

  // サーバ送信
  fetch("http://localhost:4567/post", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(postData)
  })
  .then(res => {
    if (!res.ok) throw new Error("投稿失敗");
    return res.json();
  })
  .then(data => {
    console.log("投稿結果:", data);
    alert("投稿しました！");
    window.location.href = "/";
  })
  .catch(err => {
    console.error(err);
    alert("投稿に失敗しました");
  });
});
