document.getElementById("stego-dropzone").addEventListener("click", () => {
  document.getElementById("stego-file").click();
});
document.getElementById("stego-file").addEventListener("change", (e) => {
  const file = e.target.files[0];
  const infoEl = document.getElementById("stego-info");
  if (file) {
    infoEl.textContent = `Selected file: ${file.name}`;
    // Jika preview container disembunyikan, tampilkan
    document
      .getElementById("stego-preview-container")
      .classList.remove("hidden");
  } else {
    infoEl.textContent = "";
    document.getElementById("stego-preview-container").classList.add("hidden");
  }
});
// Simple tab switching
const tabs = document.querySelectorAll("#tabs button");
const tabContents = document.querySelectorAll("#tab-content > div");

tabs.forEach((tab) => {
  tab.addEventListener("click", () => {
    // Remove active classes
    tabs.forEach((btn) =>
      btn.classList.remove("border-blue-700", "text-blue-700")
    );
    tabContents.forEach((content) => content.classList.add("hidden"));
    // Activate clicked tab
    tab.classList.add("border-blue-700", "text-blue-700");
    const tabContent = document.getElementById(
      tab.getAttribute("aria-controls")
    );
    if (tabContent) {
      tabContent.classList.remove("hidden");
    }
  });
});

// Preview Cover File
document
  .getElementById("cover-file")
  .addEventListener("change", function (event) {
    const file = event.target.files[0];
    if (!file) return;

    const previewContainer = document.getElementById("cover-preview-container");
    const imageElem = document.getElementById("cover-preview");
    const audioElem = document.getElementById("audio-preview");
    const videoElem = document.getElementById("video-preview");

    // Hide all previews
    imageElem.classList.add("hidden");
    audioElem.classList.add("hidden");
    videoElem.classList.add("hidden");

    const reader = new FileReader();
    reader.onload = function (e) {
      const result = e.target.result;
      if (file.type.startsWith("image/")) {
        imageElem.src = result;
        imageElem.classList.remove("hidden");
      } else if (file.type.startsWith("audio/")) {
        audioElem.src = result;
        audioElem.classList.remove("hidden");
      } else if (file.type.startsWith("video/")) {
        videoElem.src = result;
        videoElem.classList.remove("hidden");
      }
      previewContainer.classList.remove("hidden");
    };
    reader.readAsDataURL(file);
  });

// Preview Secret File
document
  .getElementById("secret-file")
  .addEventListener("change", function (event) {
    const file = event.target.files[0];
    if (!file) return;

    const previewContainer = document.getElementById(
      "secret-preview-container"
    );
    // Clear any previous preview content
    previewContainer.innerHTML = "";

    // Create preview element based on file type
    let previewElem;
    if (file.type.startsWith("image/")) {
      previewElem = document.createElement("img");
      previewElem.className = "max-h-48 rounded-lg";
    } else if (file.type.startsWith("audio/")) {
      previewElem = document.createElement("audio");
      previewElem.controls = true;
      previewElem.className = "w-full";
    } else if (file.type.startsWith("video/")) {
      previewElem = document.createElement("video");
      previewElem.controls = true;
      previewElem.className = "max-h-48 rounded-lg";
    } else {
      // If file type is not previewable, show file name
      previewContainer.innerHTML = `<p class="text-sm text-gray-500 dark:text-gray-400">Selected: ${file.name}</p>`;
      previewContainer.classList.remove("hidden");
      return;
    }

    const reader = new FileReader();
    reader.onload = function (e) {
      previewElem.src = e.target.result;
      previewContainer.appendChild(previewElem);
      previewContainer.classList.remove("hidden");
    };
    reader.readAsDataURL(file);
  });

// Utility function: simple XOR encryption/decryption
function xorEncryptDecrypt(input, password) {
  let output = "";
  for (let i = 0; i < input.length; i++) {
    output += String.fromCharCode(
      input.charCodeAt(i) ^ password.charCodeAt(i % password.length)
    );
  }
  return output;
}

// --- FILE STEGANOGRAPHY ---

// Hide (embed) secret file into cover file
const coverFileInput = document.getElementById("cover-file");
const secretFileInput = document.getElementById("secret-file");
const hideDataBtn = document.getElementById("hide-data-btn");
const hideResult = document.getElementById("hide-result");
const downloadStegoLink = document.getElementById("download-stego-file");
const algorithmSelect = document.getElementById("algorithm-select");
const enableEncryption = document.getElementById("enable-encryption");
const passwordContainer = document.getElementById("password-container");
const encryptPassword = document.getElementById("encrypt-password");

enableEncryption.addEventListener("change", () => {
  passwordContainer.classList.toggle("hidden", !enableEncryption.checked);
});

hideDataBtn.addEventListener("click", () => {
  if (coverFileInput.files.length === 0 || secretFileInput.files.length === 0) {
    Swal.fire({
      title: "Info!",
      text: "Please select both cover file and secret file.",
      icon: "info",
      confirmButtonText: "OK",
      customClass: {
        confirmButton: "bg-indigo-600 text-white hover:bg-indigo-700",
      },
    });
    return;
  }
  const coverFile = coverFileInput.files[0];
  const secretFile = secretFileInput.files[0];
  const selectedAlgorithm = algorithmSelect.value;
  const useEncryption = enableEncryption.checked;
  const password = encryptPassword.value || "";

  // Read both files as data URLs
  const coverReader = new FileReader();
  const secretReader = new FileReader();
  let coverDataURL = "";
  let secretDataURL = "";
  let errorOccurred = false; // Flag untuk menandai jika terjadi error

  Swal.fire({
    title: "Processing...",
    text: "Please wait while we process your files this can take seconds.",
    allowOutsideClick: false,
    allowEscapeKey: false,
    didOpen: () => {
      Swal.showLoading();
    },
  });

  coverReader.onload = function (e) {
    coverDataURL = e.target.result;
    if (secretDataURL !== "") {
      processStego();
    }
  };

  secretReader.onload = function (e) {
    secretDataURL = e.target.result;
    if (coverDataURL !== "") {
      processStego();
    }
  };

  coverReader.onerror = function (error) {
    errorOccurred = true;
    Swal.close();
    Swal.fire({
      title: "Error!",
      text: "Failed to read cover file: " + error,
      icon: "error",
      confirmButtonText: "OK",
      customClass: {
        confirmButton: "bg-red-600 text-white hover:bg-indigo-700",
      },
    });
    console.error("Failed to read cover file:", error);
  };

  secretReader.onerror = function (error) {
    errorOccurred = true;
    Swal.close();
    Swal.fire({
      title: "Error!",
      text: "Failed to read secret file: " + error,
      icon: "error",
      confirmButtonText: "OK",
      customClass: {
        confirmButton: "bg-red-600 text-white hover:bg-indigo-700",
      },
    });
    console.error("Failed to read secret file:", error);
  };

  coverReader.readAsDataURL(coverFile);
  secretReader.readAsDataURL(secretFile);

  // Pada proses enkripsi file (hideDataBtn)
  function processStego() {
    if (errorOccurred) {
      return; // Hentikan proses jika sudah terjadi error
    }
    if (useEncryption && password) {
      // Tambahkan marker "STEGFILE:" ke data asli agar bisa divalidasi saat dekripsi
      secretDataURL = "STEGFILE:" + secretDataURL;
      const encrypted = btoa(xorEncryptDecrypt(secretDataURL, password));
      secretDataURL = encrypted;
    }
    const stegoData = {
      cover: coverDataURL,
      secret: secretDataURL,
      algorithm: selectedAlgorithm,
      encrypted: useEncryption,
    };

    const stegoText = JSON.stringify(stegoData);
    const blob = new Blob([stegoText], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    downloadStegoLink.href = url;
    downloadStegoLink.style.display = "inline-block";
    hideResult.classList.remove("hidden");
    Swal.close(); // Tutup loading setelah proses berhasil
  }
});
// Extract secret file from stego file
const stegoFileInput = document.getElementById("stego-file");
const extractDataBtn = document.getElementById("extract-data-btn");
const extractResult = document.getElementById("extract-result");
const extractedFileInfo = document.getElementById("extracted-file-info");
const downloadExtractedLink = document.getElementById(
  "download-extracted-file"
);
const needDecryption = document.getElementById("need-decryption");
const decryptPasswordContainer = document.getElementById(
  "decrypt-password-container"
);
const decryptPassword = document.getElementById("decrypt-password");

needDecryption.addEventListener("change", () => {
  decryptPasswordContainer.classList.toggle("hidden", !needDecryption.checked);
});

// Extract secret file from stego file
// Extract secret file from stego file
// Extract secret file from stego file
extractDataBtn.addEventListener("click", () => {
  console.log("Tombol Ekstraksi Ditekan");
  if (stegoFileInput.files.length === 0) {
    Swal.fire({
      title: "Info!",
      text: "Please select a steganographic file.",
      icon: "info",
      confirmButtonText: "OK",
      customClass: {
        confirmButton: "bg-indigo-600 text-white hover:bg-indigo-700",
      },
    });
    return;
  }
  const stegoFile = stegoFileInput.files[0];
  const reader = new FileReader();
  Swal.fire({
    title: "Extracting...",
    text: "Please wait while we extract the secret file this can take a while.",
    allowOutsideClick: false,
    allowEscapeKey: false,
    didOpen: () => {
      Swal.showLoading();
    },
  });

  reader.onload = function (e) {
    try {
      console.log("FileReader Onload Dipanggil");
      const stegoData = JSON.parse(e.target.result);
      console.log("Data Stego yang Diurai:", stegoData);
      let secretData = stegoData.secret;
      console.log("Data Rahasia Awal:", secretData);
      if (stegoData.encrypted) {
        const pwd = decryptPassword.value || "";
        console.log("Password Dekripsi:", pwd);
        // Lakukan dekripsi dengan XOR (setelah decode base64)
        secretData = xorEncryptDecrypt(atob(secretData), pwd);
        console.log("Data Rahasia Setelah Dekripsi:", secretData);
        // Validasi marker "STEGFILE:" untuk memastikan password benar
        const marker = "STEGFILE:";
        if (!secretData.startsWith(marker)) {
          Swal.close();
          Swal.fire({
            title: "Error!",
            text: "Incorrect password for file decryption. Extraction failed.",
            icon: "error",
            confirmButtonText: "OK",
            customClass: {
              confirmButton: "bg-red-600 text-white hover:bg-indigo-700",
            },
          });
          return;
        }
        // Hapus marker agar mendapatkan Data URL asli
        secretData = secretData.slice(marker.length);
        console.log("Data Rahasia Setelah Hapus Marker:", secretData);
      }

      // Convert the secret data (a Data URL) back into a Blob for download.
      const parts = secretData.split(",");
      console.log("Bagian-bagian Data URL:", parts);
      const mimeMatch = parts[0].match(/:(.*?);/);
      const mimeType = mimeMatch ? mimeMatch[1] : "application/octet-stream";
      console.log("MIME Type Terdeteksi:", mimeType);
      const byteString = atob(parts[1] || "");
      const ab = new Uint8Array(byteString.length);
      for (let i = 0; i < byteString.length; i++) {
        ab[i] = byteString.charCodeAt(i);
      }
      const extractedBlob = new Blob([ab], { type: mimeType });
      const extractedUrl = URL.createObjectURL(extractedBlob);
      // Set download link
      downloadExtractedLink.href = extractedUrl;
      extractedFileInfo.textContent =
        "Secret file embedded in stego file extracted successfully.";

      // Tampilkan preview file
      const extractedPreviewContainer = document.getElementById(
        "extracted-preview-container"
      );
      const extractedPreview = document.getElementById("extracted-preview");

      // Bersihkan preview sebelumnya
      extractedPreview.innerHTML = "";

      if (mimeType.startsWith("image/")) {
        const img = document.createElement("img");
        img.src = secretData;
        img.className = "max-h-48 rounded-lg";
        extractedPreview.appendChild(img);
      } else if (mimeType.startsWith("audio/")) {
        const audio = document.createElement("audio");
        audio.src = secretData;
        audio.controls = true;
        audio.className = "w-full";
        extractedPreview.appendChild(audio);
      } else if (mimeType.startsWith("video/")) {
        const video = document.createElement("video");
        video.src = secretData;
        video.controls = true;
        video.className = "max-h-48 rounded-lg";
        extractedPreview.appendChild(video);
      } else if (mimeType === "application/pdf") {
        const img = document.createElement("img");
        img.src = "https://cdn-icons-png.flaticon.com/512/337/337946.png"; // ikon PDF
        img.alt = "PDF File";
        img.className = "h-16 mx-auto";
        extractedPreview.appendChild(img);
      } else if (
        mimeType === "application/msword" ||
        mimeType ===
          "application/vnd.openxmlformats-officedocument.wordprocessingml.document"
      ) {
        const img = document.createElement("img");
        img.src = "https://cdn-icons-png.flaticon.com/512/337/337932.png"; // ikon Word
        img.alt = "Word File";
        img.className = "h-16 mx-auto";
        extractedPreview.appendChild(img);
      } else if (
        mimeType === "application/vnd.ms-excel" ||
        mimeType ===
          "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"
      ) {
        const img = document.createElement("img");
        img.src = "https://cdn-icons-png.flaticon.com/512/732/732011.png"; // ikon Excel
        img.alt = "Excel File";
        img.className = "h-16 mx-auto";
        extractedPreview.appendChild(img);
      } else {
        extractedPreview.innerHTML = `
          <p class="text-sm text-gray-500 dark:text-gray-400">
            No preview available for this file type.
          </p>`;
      }

      // Tampilkan container preview dengan mengubah style.display
      Swal.close(); // setelah proses berhasil
      extractedPreviewContainer.style.display = "block";
      extractResult.style.display = "block";
    } catch (err) {
      Swal.close();
      Swal.fire({
        title: "Error!",
        text: "Failed to extract data: " + err,
        icon: "error",
        confirmButtonText: "OK",
        customClass: {
          confirmButton: "bg-red-600 text-white hover:bg-indigo-700",
        },
      });
      console.error("Terjadi Kesalahan Saat Ekstraksi:", err);
    }
  };
  reader.readAsText(stegoFile);
});
// --- TEXT STEGANOGRAPHY ---

const coverTextElem = document.getElementById("cover-text");
const secretTextElem = document.getElementById("secret-text");
const textStegoMethodSelect = document.getElementById("text-stego-method");
const hideTextBtn = document.getElementById("hide-text-btn");
const extractTextBtn = document.getElementById("extract-text-btn");
const textResult = document.getElementById("text-result");

// --- TEXT STEGANOGRAPHY FUNCTIONS ---

// Delimiter untuk memisahkan cover text dan pesan tersembunyi
const TEXT_DELIMITER = "\n|||SECRET|||";

// Fungsi konversi string ke binary (8-bit per karakter)
function stringToBinary(str) {
  let binary = "";
  for (let i = 0; i < str.length; i++) {
    binary += str.charCodeAt(i).toString(2).padStart(8, "0");
  }
  return binary;
}

// Fungsi untuk enkoding dengan metode Whitespace
function encodeWhitespace(message) {
  const binary = stringToBinary(message);
  // Map '0' ke spasi dan '1' ke tab
  let encoded = "";
  for (const bit of binary) {
    encoded += bit === "0" ? " " : "\t";
  }
  return encoded;
}

function decodeWhitespace(encoded) {
  let binary = "";
  for (const ch of encoded) {
    if (ch === " ") binary += "0";
    else if (ch === "\t") binary += "1";
  }
  let message = "";
  for (let i = 0; i < binary.length; i += 8) {
    let byte = binary.slice(i, i + 8);
    message += String.fromCharCode(parseInt(byte, 2));
  }
  return message;
}

// Untuk metode Zero-Width, gunakan U+200B sebagai 0 dan U+200C sebagai 1
const ZW0 = "\u200B";
const ZW1 = "\u200C";
function encodeZeroWidth(message) {
  const binary = stringToBinary(message);
  let encoded = "";
  for (const bit of binary) {
    encoded += bit === "0" ? ZW0 : ZW1;
  }
  return encoded;
}
function decodeZeroWidth(encoded) {
  let binary = "";
  for (const ch of encoded) {
    if (ch === ZW0) binary += "0";
    else if (ch === ZW1) binary += "1";
  }
  let message = "";
  for (let i = 0; i < binary.length; i += 8) {
    let byte = binary.slice(i, i + 8);
    message += String.fromCharCode(parseInt(byte, 2));
  }
  return message;
}

// Untuk Homoglyph Substitution (contoh sederhana gunakan base64)
function encodeHomoglyph(message) {
  return btoa(message);
}
function decodeHomoglyph(encoded) {
  return atob(encoded);
}

// Hide Message
hideTextBtn.addEventListener("click", () => {
  const coverText = coverTextElem.value;
  let secretMessage = secretTextElem.value;
  if (!coverText || !secretMessage) {
    Swal.fire({
      title: "Info!",
      text: "Please enter both cover text and secret message.",
      icon: "info",
      confirmButtonText: "OK",
      customClass: {
        confirmButton: "bg-indigo-600 text-white hover:bg-indigo-700",
      },
    });
    return;
  }
  let encryptionPrefix = "";
  // Jika enkripsi diaktifkan, tambahkan marker "STEG:" ke pesan
  if (document.getElementById("text-enable-encryption").checked) {
    const pwd = document.getElementById("text-password").value;
    if (!pwd) {
      Swal.fire({
        title: "Info!",
        text: "Please enter encryption password for text message.",
        icon: "info",
        confirmButtonText: "OK",
        customClass: {
          confirmButton: "bg-indigo-600 text-white hover:bg-indigo-700",
        },
      });
      return;
    }
    // Tambahkan marker "STEG:" sehingga setelah decrypt kita bisa validasi password
    secretMessage = "STEG:" + secretMessage;
    // Enkripsi pesan menggunakan XOR kemudian base64 encode
    secretMessage = btoa(xorEncryptDecrypt(secretMessage, pwd));
    encryptionPrefix = "ENC:";
  }
  const method = textStegoMethodSelect.value; // "whitespace", "zero-width", atau "homoglyph"
  let encodedSecret = "";
  if (method === "whitespace") {
    encodedSecret =
      encryptionPrefix + "WSPACE:" + encodeWhitespace(secretMessage);
  } else if (method === "zero-width") {
    encodedSecret =
      encryptionPrefix + "ZWIDTH:" + encodeZeroWidth(secretMessage);
  } else if (method === "homoglyph") {
    encodedSecret = encryptionPrefix + "HG:" + encodeHomoglyph(secretMessage);
  } else {
    // fallback: gunakan base64
    encodedSecret = encryptionPrefix + "HG:" + encodeHomoglyph(secretMessage);
  }
  const hiddenText = coverText + TEXT_DELIMITER + encodedSecret;
  coverTextElem.value = hiddenText;
  textResult.classList.remove("hidden");
  textResult.innerHTML = `<div class='p-4 mb-4 text-sm text-green-800 rounded-lg bg-green-50 dark:bg-gray-800 dark:text-green-400' role='alert'>
        <span class='font-medium'>Success!</span> Secret message has been hidden. You can now copy the modified cover text.
        </div>`;
});

// Extract Message
extractTextBtn.addEventListener("click", () => {
  const coverText = coverTextElem.value;
  if (!coverText.includes(TEXT_DELIMITER)) {
    Swal.fire({
      title: "Info!",
      text: "No hidden secret message found in the cover text.",
      icon: "info",
      confirmButtonText: "OK",
      customClass: {
        confirmButton: "bg-indigo-600 text-white hover:bg-indigo-700",
      },
    });
    return;
  }
  const parts = coverText.split(TEXT_DELIMITER);
  const encodedPart = parts[1] || "";

  // Pastikan metode dekripsi yang dipilih sama dengan metode yang digunakan saat enkripsi
  const selectedMethod = textStegoMethodSelect.value; // "whitespace", "zero-width", "homoglyph"
  let expectedPrefix = "";
  if (selectedMethod === "whitespace") {
    expectedPrefix = "WSPACE:";
  } else if (selectedMethod === "zero-width") {
    expectedPrefix = "ZWIDTH:";
  } else if (selectedMethod === "homoglyph") {
    expectedPrefix = "HG:";
  } else {
    Swal.fire({
      title: "Error!",
      text: "Unknown text steganography method.",
      icon: "error",
      confirmButtonText: "OK",
      customClass: {
        confirmButton: "bg-red-600 text-white hover:bg-indigo-700",
      },
    });
    return;
  }
  // Cek apakah encodedPart dimulai dengan prefix yang tepat (boleh diawali "ENC:" bila terenkripsi)
  if (
    !(
      encodedPart.startsWith("ENC:" + expectedPrefix) ||
      encodedPart.startsWith(expectedPrefix)
    )
  ) {
    Swal.fire({
      title: "Error!",
      text: "Mismatched decryption algorithm. Please select the correct method.",
      icon: "error",
      confirmButtonText: "OK",
      customClass: {
        confirmButton: "bg-red-600 text-white hover:bg-indigo-700",
      },
    });
    return;
  }

  let decodedMessage = "";
  let isEncrypted = false;
  let payload = "";
  if (encodedPart.startsWith("ENC:WSPACE:")) {
    isEncrypted = true;
    payload = encodedPart.slice("ENC:WSPACE:".length);
    decodedMessage = decodeWhitespace(payload);
  } else if (encodedPart.startsWith("WSPACE:")) {
    payload = encodedPart.slice("WSPACE:".length);
    decodedMessage = decodeWhitespace(payload);
  } else if (encodedPart.startsWith("ENC:ZWIDTH:")) {
    isEncrypted = true;
    payload = encodedPart.slice("ENC:ZWIDTH:".length);
    decodedMessage = decodeZeroWidth(payload);
  } else if (encodedPart.startsWith("ZWIDTH:")) {
    payload = encodedPart.slice("ZWIDTH:".length);
    decodedMessage = decodeZeroWidth(payload);
  } else if (encodedPart.startsWith("ENC:HG:")) {
    isEncrypted = true;
    payload = encodedPart.slice("ENC:HG:".length);
    decodedMessage = decodeHomoglyph(payload);
  } else if (encodedPart.startsWith("HG:")) {
    payload = encodedPart.slice("HG:".length);
    decodedMessage = decodeHomoglyph(payload);
  } else {
    try {
      decodedMessage = atob(encodedPart);
    } catch (err) {
      Swal.fire({
        title: "Error!",
        text: "Failed to extract secret message: " + err,
        icon: "error",
        confirmButtonText: "OK",
        customClass: {
          confirmButton: "bg-red-600 text-white hover:bg-indigo-700",
        },
      });
      return;
    }
  }
  // Jika pesan sebelumnya terenkripsi, lakukan dekripsi
  if (isEncrypted) {
    const pwd = document.getElementById("text-password").value;
    if (!pwd) {
      Swal.fire({
        title: "Info!",
        text: "Encryption password required to decrypt message.",
        icon: "info",
        confirmButtonText: "OK",
        customClass: {
          confirmButton: "bg-indigo-600 text-white hover:bg-indigo-700",
        },
      });
      return;
    }
    try {
      decodedMessage = xorEncryptDecrypt(atob(decodedMessage), pwd);
    } catch (err) {
      Swal.fire({
        title: "Error!",
        text: "Failed to decrypt message: " + err,
        icon: "error",
        confirmButtonText: "OK",
        customClass: {
          confirmButton: "bg-red-600 text-white hover:bg-indigo-700",
        },
      });
      return;
    }
    // Validasi marker pesan (misal "STEG:")
    const marker = "STEG:";
    if (!decodedMessage.startsWith(marker)) {
      Swal.fire({
        title: "Error!",
        text: "Incorrect password. Unable to decrypt secret message.",
        icon: "error",
        confirmButtonText: "OK",
        customClass: {
          confirmButton: "bg-red-600 text-white hover:bg-indigo-700",
        },
      });
      return;
    }
    // Hapus marker sebelum menampilkan pesan
    decodedMessage = decodedMessage.slice(marker.length);
  }
  secretTextElem.value = decodedMessage;
  textResult.classList.remove("hidden");
  textResult.innerHTML = `<div class='p-4 mb-4 text-sm text-green-800 rounded-lg bg-green-50 dark:bg-gray-800 dark:text-green-400' role='alert'>
            <span class='font-medium'>Success!</span> Secret message extracted and populated in the secret message field.
        </div>`;
});
// Toggle password visibility handlers (existing)
document.getElementById("toggle-password")?.addEventListener("click", () => {
  const passwordInput = document.getElementById("encrypt-password");
  passwordInput.type = passwordInput.type === "password" ? "text" : "password";
});

document
  .getElementById("toggle-decrypt-password")
  ?.addEventListener("click", () => {
    const passwordInput = document.getElementById("decrypt-password");
    passwordInput.type =
      passwordInput.type === "password" ? "text" : "password";
  });

document
  .getElementById("toggle-text-password")
  ?.addEventListener("click", () => {
    const passwordInput = document.getElementById("text-password");
    passwordInput.type =
      passwordInput.type === "password" ? "text" : "password";
  });

// Tampilkan atau sembunyikan input password untuk text steganography
document
  .getElementById("text-enable-encryption")
  .addEventListener("change", (event) => {
    document
      .getElementById("text-password-container")
      .classList.toggle("hidden", !event.target.checked);
  });
