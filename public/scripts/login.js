// キャンプ会場ごとのメンター一覧 (サンプル)
const campData = {
  "早稲田大学 2025.03.26-03.29": ["共通","ほのぴ", "キノヤ", "あいりす", "だーす", "ことり/ダイキチ", "さぁ坊", 
    "しーぷ", "ゆわ", "ぎる", "ひとで", "はーちぃ", "島ちゃん", "らい", "まなち", "さくこ/まるぴ", "かむり"],
  // "東京大学 2025.03.31-04.02": ["メンターD", "メンターE"],
  // "東京科学大学 2025.04.04-04.06": ["メンターF", "メンターG", "メンターH"]
};

// キャンプデータの対応表（長い表記 → 短縮キー）
const campMapping = {
  "早稲田大学 2025.03.26-03.29": "waseda",
  "東京大学 2025.03.31-04.02": "tokyo",
  "東京科学大学 2025.04.04-04.06": "toko"
};

  
  const campSelect = document.getElementById("campSelect");
  const mentorSelect = document.getElementById("mentorSelect");
  const passwordInput = document.getElementById("passwordInput");
  const loginButton = document.getElementById("loginButton");
  
  // キャンプ会場の変更時にメンターリストを更新
  campSelect.addEventListener("change", () => {
    const selectedCamp = campSelect.value;
    mentorSelect.innerHTML = ""; // 一旦クリア
  
    // 「選択してください」の初期オプション
    const defaultOption = document.createElement("option");
    defaultOption.value = "";
    defaultOption.textContent = "選択してください";
    mentorSelect.appendChild(defaultOption);
  
    if (selectedCamp && campData[selectedCamp]) {
      // メンターを追加
      campData[selectedCamp].forEach((mentor) => {
        const option = document.createElement("option");
        option.value = mentor;
        option.textContent = mentor;
        mentorSelect.appendChild(option);
      });
      mentorSelect.disabled = false;
    } else {
      mentorSelect.disabled = true;
    }
  
    checkFormValidity();
  });
  
  // メンターの変更 or パスワードの入力時にボタンの活性/非活性をチェック
  mentorSelect.addEventListener("change", checkFormValidity);
  passwordInput.addEventListener("input", checkFormValidity);
  
  function checkFormValidity() {
    const selectedCamp = campSelect.value;
    const selectedMentor = mentorSelect.value;
    const password = passwordInput.value;
  
    // 全て入力されている場合のみログインボタンを有効
    if (selectedCamp && selectedMentor && password) {
      loginButton.disabled = false;
    } else {
      loginButton.disabled = true;
    }
  }
  
  // ログインボタンクリック時の処理
  loginButton.addEventListener("click", async () => {
    const selectedCamp = campSelect.value;
    const selectedMentor = mentorSelect.value;
    const password = passwordInput.value;

    const shortCamp = campMapping[selectedCamp] || selectedCamp;

    try {
      // バックエンド (Sinatra) の /login へPOST通信
      const response = await fetch("https://springcamp2025.onrender.com/login", {
      //const response = await fetch("http://localhost:4567/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: selectedMentor,
          place: shortCamp,
          password: password
        })
      });

      if (response.ok) {
        // ログイン成功 → localStorageに保存してトップページへ
        localStorage.setItem("selectedCamp", shortCamp);
        localStorage.setItem("selectedMentor", selectedMentor);
        localStorage.setItem("password", password);

        alert("ログイン成功");
        window.location.href = "/top";
      } else {
        // 401など → ログイン失敗
        alert("ログイン失敗");
      }
    } catch (error) {
      console.error(error);
      alert("通信エラーが発生しました");
    }
  });
  