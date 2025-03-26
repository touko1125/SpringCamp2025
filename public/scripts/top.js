'use strict';

// キャンプ会場と対応するメンター候補（shortCampに合わせたデータ）
const campData = {
  "waseda": [
    "共通", "ほのぴ", "キノヤ", "あいりす", "だーす", "ことり/ダイキチ", "さぁ坊", 
    "しーぷ", "ゆわ", "ぎる", "ひとで", "はーちぃ", "島ちゃん", "らい", "まなち", "さくこ/まるぴ", "かむり"
  ],
  // 必要に応じて他のキャンプも追加（キーは campMapping の短縮キーに合わせる）
};

// キャンプデータの対応表（長い表記 → 短縮キー）
const campMapping = {
  "早稲田大学 2025.03.26-03.29": "waseda",
  "東京大学 2025.03.31-04.02": "tokyo",
  "東京科学大学 2025.04.04-04.06": "toko"
};

window.addEventListener("DOMContentLoaded", () => {
  // HTML要素を取得
  const selectedCampDisplay = document.getElementById("selectedCampDisplay");
  const filterMentorSelect = document.getElementById("filterMentorSelect");
  const photoArea = document.getElementById("photoArea");
  const cameraButton = document.getElementById("cameraButton");
  const saveButton = document.getElementById("saveButton");

  // ログイン画面で保存した会場名（長い表記）を取得
  const storedCamp = localStorage.getItem("selectedCamp");
  const selectedCamp = storedCamp ? storedCamp : "（未選択）";
  // 短縮キーの取得（選択なしなら空文字）
  const shortCamp = (storedCamp && storedCamp !== "（未選択）") ? (campMapping[storedCamp] || storedCamp) : "";

  // 表示には元の値を使用
  if (selectedCampDisplay) {
    selectedCampDisplay.textContent = selectedCamp;
  }

  // 選択されたキャンプに対応するメンター候補を filterMentorSelect に動的追加
  if (filterMentorSelect) {
    filterMentorSelect.innerHTML = "";
    const defaultOption = document.createElement("option");
    defaultOption.value = "";
    defaultOption.textContent = "担当のメンターさんを選んでね！（未選択なら『共通』）";
    filterMentorSelect.appendChild(defaultOption);
    // キャンプが選択されている場合のみメンター情報を追加
    if (storedCamp && storedCamp !== "（未選択）") {
      const mentors = campData[shortCamp] || [];
      mentors.forEach((mentor) => {
        const option = document.createElement("option");
        option.value = mentor;
        option.textContent = mentor;
        filterMentorSelect.appendChild(option);
      });
    }
  }

  // 初回は、常に GET /posts/:place/:name を使用する
  // mentorFilter は、filterMentorSelect.value が空の場合は「共通」に設定
  let initialMentor = (filterMentorSelect && filterMentorSelect.value) ? filterMentorSelect.value : "共通";
  fetchPosts(shortCamp, initialMentor);

  // メンター絞り込みイベント
  if (filterMentorSelect) {
    filterMentorSelect.addEventListener("change", () => {
      const selectedMentor = filterMentorSelect.value || "共通";
      fetchPosts(shortCamp, selectedMentor);
    });
  }

  // カメラボタンのクリックでカメラ画面へ遷移
  if (cameraButton) {
    cameraButton.addEventListener("click", () => {
      window.location.href = "/camera";
    });
  }

  // 保存ボタン：dom-to-image を使って photoArea を画像として保存
  if (saveButton) {
    saveButton.addEventListener("click", () => {
      ensureImagesLoaded(photoArea).then(() => {
        domtoimage.toPng(photoArea)
          .then((dataUrl) => {
            const link = document.createElement("a");
            link.download = 'dom-to-image.png';
            link.href = dataUrl;
            link.click();
          })
          .catch((error) => {
            console.error('dom-to-image エラー:', error);
          });
      });
    });
  }
});

/**
 * 指定されたキャンプ（shortCamp）とメンター（mentorFilter）に応じた投稿データを取得し、
 * renderImages() を呼び出す
 * @param {string} shortCamp - キャンプの短縮キー。空文字の場合は選択なし
 * @param {string} mentorFilter - メンター名。空の場合は「共通」とする
 */
function fetchPosts(shortCamp, mentorFilter) {
  let fetchUrl = "";
  if (!shortCamp) {
    // 選択なしの場合は、全ての投稿を取得
    fetchUrl = "https://springcamp2025.onrender.com/posts/";
  } else {
    // mentorFilter が空の場合はデフォルトで「共通」を使用
    const mentorParam = mentorFilter || "共通";
    fetchUrl = `https://springcamp2025.onrender.com/posts/${encodeURIComponent(shortCamp)}/${encodeURIComponent(mentorParam)}`;
  }

  fetch(fetchUrl)
    .then(res => res.json())
    .then(posts => {
      window.postsData = posts;
      const filterMentorSelect = document.getElementById("filterMentorSelect");
      const photoArea = document.getElementById("photoArea");
      renderImages(filterMentorSelect, photoArea, posts);
    })
    .catch(err => console.error(err));
}

/**
 * 投稿データを使って画像を表示する関数
 * @param {HTMLSelectElement} filterMentorSelect - メンター絞り込み用セレクト
 * @param {HTMLElement} photoArea - 画像表示領域
 * @param {Array} postsData - バックエンドから取得した投稿データの配列
 */
function renderImages(filterMentorSelect, photoArea, postsData) {
  if (!photoArea) return;

  const filterValue = filterMentorSelect ? filterMentorSelect.value : "";
  photoArea.innerHTML = "";

  // フィルター：filterValue が空ならすべて、そうでなければ post.user.username と比較
  const filtered = postsData.filter(post => {
    if (!filterValue) return true;
    return post.user && post.user.username === filterValue;
  });

  filtered.forEach(post => {
    const container = document.createElement("div");
    container.className = "polaroid";

    // ピン画像
    const pinImg = document.createElement("img");
    pinImg.src = "img/pin.png";
    pinImg.alt = "pin";
    pinImg.className = "pin-icon";
    container.appendChild(pinImg);

    // 投稿画像
    const photo = document.createElement("img");
    photo.src = post.img_link;
    photo.alt = post.user ? post.user.username : "";
    photo.className = "photo-img";
    container.appendChild(photo);

    // 日付表示（created_at をローカル日付に変換）
    const dateText = document.createElement("p");
    const d = new Date(post.created_at);
    dateText.textContent = d.toLocaleDateString();
    container.appendChild(dateText);

    // メンター名表示
    const mentorText = document.createElement("p");
    mentorText.textContent = post.user ? post.user.username : "";
    container.appendChild(mentorText);

    // ランダム回転（-5度～+5度）
    const deg = Math.floor(Math.random() * 11) - 5;
    container.style.transform = `rotate(${deg}deg)`;

    photoArea.appendChild(container);
  });
}

/**
 * 画像がすべて読み込まれているか確認するヘルパー関数
 * @param {HTMLElement} container - 対象のコンテナ
 * @returns {Promise} - すべての画像が読み込まれたら解決するPromise
 */
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
