let facingMode = "user"; // "environment"で外カメラ、"user"でインカメラ
const cameraVideo = document.getElementById("cameraVideo");
const switchButton = document.getElementById("switchButton");
const takePhotoButton = document.getElementById("takePhotoButton");

// カメラ起動
function startCamera() {
  navigator.mediaDevices.getUserMedia({ video: { facingMode }, audio: false })
    .then(stream => {
      cameraVideo.srcObject = stream;
    })
    .catch(err => {
      console.error("カメラ起動エラー:", err);
    });
}

// 初期起動
window.addEventListener("DOMContentLoaded", () => {
  startCamera();
});

// カメラ切り替え
switchButton.addEventListener("click", () => {
  // 現在のfacingModeを逆にする
  facingMode = (facingMode === "user") ? "environment" : "user";

  // 既存ストリームを停止してから再起動
  if (cameraVideo.srcObject) {
    cameraVideo.srcObject.getTracks().forEach(track => track.stop());
  }
  startCamera();
});

// 撮影ボタン
takePhotoButton.addEventListener("click", () => {
  // 本来はCanvasで写真を取得し、画像データを保存・編集画面に渡すなどの処理
  // ここでは仮で edit.html に移動するだけ
  window.location.href = "/edit";
});
