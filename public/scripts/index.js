'use strict';

// -------------------------------
// 1) メンター選択 & カメラ起動ボタン制御
// -------------------------------
window.addEventListener("DOMContentLoaded", () => {
  // キャンプ会場は早稲田大学固定
  const shortCamp = "waseda"; 

  const mentorSelect = document.getElementById("mentorSelect");
  const cameraButton = document.getElementById("cameraButton");

  // メンターを選択するまで「カメラを起動」ボタンは無効
  mentorSelect.addEventListener("change", () => {
    cameraButton.disabled = !mentorSelect.value;
  });

  // カメラ起動クリック時に localStorage に保存して撮影ページへ遷移
  cameraButton.addEventListener("click", () => {
    localStorage.setItem("selectedCamp", shortCamp);
    localStorage.setItem("selectedMentor", mentorSelect.value);
    window.location.href = "/post";
  });
});


// -------------------------------
// 2) コルクボードに既存投稿を表示 & スタンプ編集機能を統合
// -------------------------------

// キャンプ会場とメンターの対応表（長い表記→短縮キー）
const campMapping = {
  "早稲田大学 2025.03.26-03.29": "waseda",
  "東京大学 2025.03.31-04.02": "tokyo",
  "東京科学大学 2025.04.04-04.06": "toko"
};

// メンター一覧（必要に応じて追加）
const campData = {
  "waseda": [
    "ほのぴ", "キノヤ", "あいりす", "だーす", "ことり/ダイキチ",
    "さぁ坊", "しーぷ", "ゆわ", "ぎる", "ひとで", "はーちぃ",
    "島ちゃん", "らい", "まなち", "さくこ/まるぴ", "かむり"
  ],
  // 他キャンプも必要に応じて定義
};

// ★★★ スタンプID→スタンプ画像URLの対応表 (enum -> src) ★★★
const stampMapping = {
  1: "stamps/course/ai_creative.png",
  2: "stamps/course/android.png",
  3: "stamps/course/animation.png",
  4: "stamps/course/camera.png",
  5: "stamps/course/designer.png",
  6: "stamps/course/digital_music.png",
  7: "stamps/course/iphone.png",
  8: "stamps/course/media_art.png",
  9: "stamps/course/miku.png",
  10: "stamps/course/minecraft.png",
  11: "stamps/course/movie.png",
  12: "stamps/course/unity.png",
  13: "stamps/course/web_design.png",
  14: "stamps/course/web_service.png",
  15: "stamps/mentor/marupi.png"
};

// 選択中の画像を管理するグローバル変数
let selectedImg = null;

window.addEventListener("DOMContentLoaded", () => {
  const mentorSelect = document.getElementById("mentorSelect");

  mentorSelect.addEventListener("change", () => {
    if (!mentorSelect.value) {
      // 空を選択 → なにもしない / ボードクリア等お好みで
      corkBoard.innerHTML = "";
      return;
    }

    // 値が選択されていればfetch
    fetchLayoutFromServer(mentorSelect.value);
  });

  // ---------------------------
  // 2-2) コルクボードやボタン等の要素取得
  // ---------------------------
  const corkBoard = document.getElementById("corkBoard");
  const saveButton = document.getElementById("saveButton");
  const postButton = document.getElementById("postButton");
  const stampList = document.getElementById("stampList");

  // ---------------------------
  // 2-3) スタンプ一覧 → コルクボードへ追加
  // ---------------------------
  if (stampList) {
    stampList.querySelectorAll("img").forEach((stampImg) => {
      stampImg.addEventListener("click", () => {
        const stampId = parseInt(stampImg.getAttribute("data-stamp-id") || "0", 10);
        addStampToBoard(stampImg.src, stampId, corkBoard);
      });
    });
  }

  // ---------------------------
  // 2-4) コルクボード保存ボタン (ローカルにPNGをDL)
  // ---------------------------
  if (saveButton) {
    saveButton.addEventListener("click", () => {
      ensureImagesLoaded(corkBoard).then(() => {
        domtoimage.toPng(corkBoard)
          .then((dataUrl) => {
            const link = document.createElement("a");
            link.download = 'board-image.png';
            link.href = dataUrl;
            link.click();
          })
          .catch((error) => {
            console.error('dom-to-image エラー:', error);
          });
      });
    });
  }

  // ---------------------------
  // 2-5) 投稿ボタン：コルクボード全体を画像化 + レイアウト情報をサーバーに送信
  // ---------------------------
  if (postButton) {
    postButton.addEventListener("click", () => {
      // 1) コルクボード全体をBase64化
      ensureImagesLoaded(corkBoard).then(() => {
        return domtoimage.toPng(corkBoard);
      })
      .then((base64Image) => {
        // 2) レイアウト情報を収集 (すべての写真・スタンプ)
        const layoutData = collectLayoutData(corkBoard);

        // 3) localStorageからログイン情報を取得
        const selectedCamp = localStorage.getItem("selectedCamp") || "waseda";
        const selectedMentor = localStorage.getItem("selectedMentor") || "共通";

        // 4) サーバに JSON 送信
        //return fetch("http://localhost:4567/post/albumn", {
          return fetch("https://springcamp2025.onrender.com/post/albumn", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            name: selectedMentor,
            place: selectedCamp,
            layout: layoutData
          })
        });
      })
      .then((response) => {
        if (response.ok) {
          alert("投稿しました！");
          window.location.href = "/";
        } else {
          alert("投稿に失敗しました");
        }
      })
      .catch((error) => {
        console.error('投稿エラー:', error);
        alert("通信エラーが発生しました");
      });
    });
  }

  // ---------------------------
  // 2-6) コルクボードをクリックしたら、画像が未選択になる
  // ---------------------------
  if (corkBoard) {
    corkBoard.addEventListener("mousedown", (e) => {
      if (e.target === corkBoard) {
        if (selectedImg) {
          selectedImg.style.outline = "none";
        }
        selectedImg = null;
      }
    });
    corkBoard.addEventListener("touchstart", (e) => {
      if (e.target === corkBoard && e.touches.length === 1) {
        if (selectedImg) {
          selectedImg.style.outline = "none";
        }
        selectedImg = null;
      }
    }, { passive: false });
  }
});


// ===================================================
// A) サーバからの「レイアウト情報付きレスポンス」を取得
// ===================================================
function fetchLayoutFromServer(user) {
  if(!user) return;
  const corkBoard = document.getElementById("corkBoard");
  if (!corkBoard) return;

  // 例: GET /album/:username で { layout: [ ... ] } を受け取る想定
  //const url = `http://localhost:4567/album/${encodeURIComponent(user)}`;
  const url = `https://springcamp2025.onrender.com/album/${encodeURIComponent(user)}`;
  fetch(url)
    .then(res => res.json())
    .then(data => {
      // data.layout が配列になっている想定
      if (data.layout && Array.isArray(data.layout)) {
        renderLayoutToBoard(data.layout, corkBoard);
      }
    })
    .catch(err => console.error(err));
}


// ===================================================
// B) 受け取ったレイアウト情報をコルクボードに反映
// ===================================================
function renderLayoutToBoard(layoutArray, corkBoard) {
  corkBoard.innerHTML = "";

  layoutArray.forEach(item => {
    if (item.type === "photo") {
      // 投稿された写真（post）を再配置
      const photo = document.createElement("img");
      photo.src = item.img_link || "";
      photo.alt = `photo-${item.id}`;
      photo.draggable = false;
      photo.style.position = "absolute";
      photo.style.left = (item.x || 50) + "px";
      photo.style.top = (item.y || 50) + "px";
      photo.style.width = (item.width || 100) + "px";
      photo.style.touchAction = "none";

      // data属性
      photo.dataset.type = "photo";
      photo.dataset.id   = item.id; // たとえば post.id

      makeDraggable(photo, corkBoard);
      corkBoard.appendChild(photo);

    } else if (item.type === "stamp") {
      // スタンプ
      const stamp = document.createElement("img");
      // サーバ側で img_link があればそれを優先し、なければ stampMapping 参照
      stamp.src = item.img_link || stampMapping[item.id] || "";
      stamp.alt = `stamp-${item.id}`;
      stamp.draggable = false;
      stamp.style.position = "absolute";
      stamp.style.left = (item.x || 20) + "px";
      stamp.style.top = (item.y || 20) + "px";
      stamp.style.width = (item.width || 50) + "px";
      stamp.style.touchAction = "none";

      // data属性
      stamp.dataset.type = "stamp";
      stamp.dataset.id   = item.id; // enum IDなど

      makeDraggable(stamp, corkBoard);
      corkBoard.appendChild(stamp);
    }
  });
}


// ===================================================
// C) コルクボード上の要素をスキャンしてレイアウト情報を作る
// ===================================================
function collectLayoutData(corkBoard) {
  const items = corkBoard.querySelectorAll("img");
  const layout = [];

  items.forEach(img => {
    const type = img.dataset.type;    // "photo" or "stamp"
    const id   = parseInt(img.dataset.id, 10) || 0;  
    const x    = parseInt(img.style.left, 10)  || 0;
    const y    = parseInt(img.style.top, 10)   || 0;
    const width= parseInt(img.style.width, 10) || 100;

    layout.push({ type, id, x, y, width });
  });

  return layout;
}


// ===================================================
// D) スタンプをコルクボードへ貼り付ける関数
// ===================================================
function addStampToBoard(stampSrc, stampId, corkBoard) {
  const stamp = document.createElement("img");
  stamp.src = stampSrc;
  stamp.draggable = false;
  stamp.style.position = "absolute";
  stamp.style.left = "20px";
  stamp.style.top = "20px";
  stamp.style.width = "50px";
  stamp.style.touchAction = "none";

  // データ属性
  stamp.dataset.type = "stamp";
  stamp.dataset.id   = stampId;  // enumのint値

  makeDraggable(stamp, corkBoard);
  corkBoard.appendChild(stamp);
}


// ===================================================
// E) ドラッグ&リサイズ可能にする共通関数 (PC/タッチ両対応)
// ===================================================
function makeDraggable(targetImg, parent) {
  let isDragging = false;
  let offsetX = 0;
  let offsetY = 0;

  // ピンチズーム用
  let startDistance = 0;
  let initialWidth = 0;

  // ----- マウス操作 -----
  targetImg.addEventListener("mousedown", (e) => {
    e.preventDefault(); 
    // 選択枠の切り替え
    if (selectedImg && selectedImg !== targetImg) {
      selectedImg.style.outline = "none";
    }
    selectedImg = targetImg;
    selectedImg.style.outline = "3px solid white";

    isDragging = true;
    offsetX = e.offsetX;
    offsetY = e.offsetY;
  });

  parent.addEventListener("mousemove", (e) => {
    if (!isDragging) return;
    const rect = parent.getBoundingClientRect();
    const x = e.clientX - rect.left - offsetX;
    const y = e.clientY - rect.top - offsetY;
    targetImg.style.left = x + "px";
    targetImg.style.top = y + "px";
  });

  parent.addEventListener("mouseup", () => {
    isDragging = false;
  });
  parent.addEventListener("mouseleave", () => {
    isDragging = false;
  });

  // マウスホイールでリサイズ
  targetImg.addEventListener("wheel", (e) => {
    e.preventDefault();
    const currentWidth = targetImg.offsetWidth;
    let newWidth = currentWidth - (e.deltaY > 0 ? 5 : -5);
    if (newWidth < 20) newWidth = 20;
    targetImg.style.width = newWidth + "px";
  });

  // ----- タッチ操作(ドラッグ & ピンチ) -----
  targetImg.addEventListener("touchstart", (e) => {
    if (e.touches.length === 1) {
      // ドラッグ開始
      const touch = e.touches[0];
      if (selectedImg && selectedImg !== targetImg) {
        selectedImg.style.outline = "none";
      }
      selectedImg = targetImg;
      selectedImg.style.outline = "3px solid white";

      const rect = targetImg.getBoundingClientRect();
      offsetX = touch.clientX - rect.left;
      offsetY = touch.clientY - rect.top;

    } else if (e.touches.length === 2) {
      // ピンチズーム開始
      startDistance = getTouchDistance(e.touches[0], e.touches[1]);
      initialWidth = targetImg.offsetWidth;
    }
  }, { passive: false });

  parent.addEventListener("touchmove", (e) => {
    if (e.touches.length === 1 && selectedImg === targetImg) {
      // 1本指ドラッグ
      const touch = e.touches[0];
      const rect = parent.getBoundingClientRect();
      const x = touch.clientX - rect.left - offsetX;
      const y = touch.clientY - rect.top - offsetY;
      targetImg.style.left = x + "px";
      targetImg.style.top = y + "px";

    } else if (e.touches.length === 2 && selectedImg === targetImg) {
      // 2本指ピンチズーム
      const newDistance = getTouchDistance(e.touches[0], e.touches[1]);
      const scale = newDistance / startDistance;
      let newWidth = initialWidth * scale;
      if (newWidth < 20) newWidth = 20;
      targetImg.style.width = newWidth + "px";
    }
  }, { passive: false });

  parent.addEventListener("touchend", (e) => {
    // 指が離れたら終了（細かい制御は必要なら追加）
  }, { passive: false });
}

// 2本のタッチ間の距離を計算
function getTouchDistance(touch1, touch2) {
  const dx = touch1.clientX - touch2.clientX;
  const dy = touch1.clientY - touch2.clientY;
  return Math.sqrt(dx * dx + dy * dy);
}


// ===================================================
// F) 画像ロード完了待ち
// ===================================================
function ensureImagesLoaded(container) {
  const imgs = container.querySelectorAll("img");
  const promises = Array.from(imgs).map(img => {
    if (img.complete) return Promise.resolve();
    return new Promise(resolve => {
      img.onload = resolve;
      img.onerror = resolve;
    });
  });
  return Promise.all(promises);
}
