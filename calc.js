// file name js/calc.js -> udhar calc.js 
// this also includes fetching the location after pop up in the calculation window 

// 🌍 Ask for user's location on page load


window.addEventListener("load", () => {
  if (navigator.geolocation) {
    navigator.geolocation.getCurrentPosition(
      position => {
        const lat = position.coords.latitude.toFixed(5);
        const lon = position.coords.longitude.toFixed(5);
        document.getElementById("location").value = `${lat}, ${lon}`;
        console.log("User location:", lat, lon);
      },
      error => {
        console.warn("Geolocation denied or unavailable:", error.message);
        alert("Location access denied. Please enter manually.");
      }
    );
  } else {
    alert("Geolocation is not supported by your browser.");
  }
});

// 🏗 Auto-fill runoff coefficient based on material
const materialSelect = document.getElementById("material");
const runoffInput = document.getElementById("runoff");

const runoffValues = {
  concrete: 0.85,
  metal: 0.9,
  tiles: 0.75,
  asbestos: 0.8
};

materialSelect.addEventListener("change", () => {
  runoffInput.value = runoffValues[materialSelect.value] || "";
});

// 📝 Form submission
document.getElementById("calcForm").addEventListener("submit", e => {
  e.preventDefault();

  // ✅ Correctly fetch all values from DOM
  const data = {
    city: document.getElementById("city").value,
    location: document.getElementById("location").value,
    length: document.getElementById("length").value,
    breadth: document.getElementById("breadth").value,
    material: document.getElementById("material").value,
    slope: document.getElementById("slope").value,
    runoff: document.getElementById("runoff").value
  };

  console.log("Data ready for backend:", data);

  // Example: redirect to report page
  window.location.href = "report.html";

  // Later: you can send `data` to backend via fetch/AJAX
});
