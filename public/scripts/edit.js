const photoPreview = document.getElementById("photoPreview");
const photoInner = document.getElementById("photoInner");
const previewImage = document.getElementById("previewImage");
const stampList = document.getElementById("stampList");
const postButton = document.getElementById("postButton");
const saveButton = document.getElementById("saveButton");

// メモ入力と表示用
const memoInput = document.getElementById("memoInput");
const memoDisplay = document.getElementById("memoDisplay");
// 日付表示用（固定）
const dateDisplay = document.getElementById("dateDisplay");

// ドラッグ用変数
let currentDragStamp = null;
let offsetX = 0;
let offsetY = 0;

// 現在の日付を取得して「YYYY.MM.DD」形式にフォーマットする関数
function getFormattedDate() {
  const now = new Date();
  const year = now.getFullYear();
  const month = String(now.getMonth() + 1).padStart(2, '0'); // 月は0から始まるので+1
  const day = String(now.getDate()).padStart(2, '0');
  return `${year}.${month}.${day}`;
}

// 初期表示：日付は常に固定
dateDisplay.textContent = getFormattedDate();

// メモ入力欄のイベント：入力が空なら何も表示せず、入力があればその内容を表示
memoInput.addEventListener("input", () => {
  if (memoInput.value.trim() === "") {
    memoDisplay.textContent = "";
  } else {
    memoDisplay.textContent = memoInput.value;
  }
});

// スタンプ一覧のサムネイルをクリック → photoInner 内に追加
stampList.querySelectorAll("img").forEach((stampImg) => {
  stampImg.addEventListener("click", () => {
    addStampToPreview(stampImg.src);
  });
});

function addStampToPreview(stampSrc) {
  const stamp = document.createElement("img");
  stamp.src = stampSrc;
  stamp.className = "stamp-draggable";
  stamp.style.left = "20px";
  stamp.style.top = "20px";
  stamp.style.width = "50px";

  // ドラッグ開始
  stamp.addEventListener("mousedown", (e) => {
    currentDragStamp = stamp;
    offsetX = e.offsetX;
    offsetY = e.offsetY;
  });

  // ホイールでサイズ変更
  stamp.addEventListener("wheel", (e) => {
    e.preventDefault();
    const currentWidth = stamp.offsetWidth;
    let newWidth = currentWidth - (e.deltaY > 0 ? 5 : -5);
    if (newWidth < 20) newWidth = 20;
    stamp.style.width = newWidth + "px";
  });

  photoInner.appendChild(stamp);
}

// photoInner 内でのドラッグ処理
photoInner.addEventListener("mousemove", (e) => {
  if (currentDragStamp) {
    const rect = photoInner.getBoundingClientRect();
    const x = e.clientX - rect.left - offsetX;
    const y = e.clientY - rect.top - offsetY;
    currentDragStamp.style.left = x + "px";
    currentDragStamp.style.top = y + "px";
  }
});
photoInner.addEventListener("mouseup", () => {
  currentDragStamp = null;
});
photoInner.addEventListener("mouseleave", () => {
  currentDragStamp = null;
});


postButton.addEventListener("click", () => {
  // まず #photoPreview を画像化
  domtoimage.toPng(photoPreview)
    .then((dataUrl) => {
      // dataUrl は "data:image/png;base64,..." の文字列

      // ログイン情報を localStorage から取得
      const selectedCamp = localStorage.getItem("selectedCamp");
      const selectedMentor = localStorage.getItem("selectedMentor");

      // サーバーに送信するための POST リクエストを実行
      return fetch("https://springcamp2025.onrender.com/post", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: selectedMentor,
          place: selectedCamp,
          img_link: dataUrl
        })
      });
    })
    .then((response) => {
      if (response.ok) {
        alert("投稿しました！");
        window.location.href = "/top";
      } else {
        alert("投稿に失敗しました");
      }
    })
    .catch((error) => {
      console.error('dom-to-image / POSTエラー:', error);
      alert("通信エラーが発生しました");
    });
});

// 保存ボタン：photoPreview（フレーム全体）を画像として保存
if (saveButton) {

  saveButton.addEventListener("click", () => {
    domtoimage.toPng(photoPreview)
      .then((dataUrl) => {
        // ダウンロードリンクを作成
        const link = document.createElement("a");
        link.download = 'dom-to-image.png';
        link.href = dataUrl;
        link.click();
      })
      .catch((error) => {
        console.error('dom-to-image エラー:', error);
      });
  });
}