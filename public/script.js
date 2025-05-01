
async function loadPost() {
  try {
    const res = await fetch('/fb-posts');
    if (!res.ok) throw new Error("Network response was not ok");
    const data = await res.json();
    if (!data) {
      document.getElementById("textBox").textContent = "No fishing report found.";
      return;
    }

    document.getElementById("header").textContent = data.header;
    document.getElementById("textBox").textContent = data.text;

    const imageBox = document.getElementById("imageBox");
    imageBox.innerHTML = "";
    data.images.forEach((src, i) => {
      const img = document.createElement("img");
      img.src = src;
      if (i === 0) img.classList.add("active");
      imageBox.appendChild(img);
    });

    let index = 0;
    const imgs = imageBox.querySelectorAll("img");
    setInterval(() => {
      imgs.forEach(img => img.classList.remove("active"));
      imgs[index % imgs.length].classList.add("active");
      index++;
    }, 5000);
  } catch (err) {
    document.getElementById("textBox").textContent = "Failed to load posts. Please refresh.";
    console.error("Error loading posts:", err);
  }
}

loadPost();
