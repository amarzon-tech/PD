
// app.js
import { initializeApp } from "https://www.gstatic.com/firebasejs/10.3.0/firebase-app.js";
import { getDatabase, ref, push, set, onValue } from "https://www.gstatic.com/firebasejs/10.3.0/firebase-database.js";

// Your Firebase config (will be replaced with actual credentials during deployment)
const firebaseConfig = {
  apiKey: "AIzaSyADaMItYzclJ5Vq6JNeJdGPCRq6K_Wc3Ds",
  authDomain: "pd-tracker-709d4.firebaseapp.com",
  databaseURL: "https://pd-tracker-709d4-default-rtdb.firebaseio.com",
  projectId: "pd-tracker-709d4",
  storageBucket: "pd-tracker-709d4.firebasestorage.app",
  messagingSenderId: "487349243503",
  appId: "1:487349243503:web:063de036ef5ca96d37079a",
  measurementId: "G-DGRH9HJL1R"
};
// Initialize Firebase
const app = initializeApp(firebaseConfig);
const db = getDatabase(app);

const form = document.getElementById("exchangeForm");
const patientSelect = document.getElementById("patient");
const ufChartCtx = document.getElementById("ufChart").getContext("2d");
const bpChartCtx = document.getElementById("bpChart").getContext("2d");

let ufChart, bpChart;

form.addEventListener("submit", async (e) => {
  e.preventDefault();

  const patientId = patientSelect.value;
  const datetime = document.getElementById("datetime").value;
  const dialysisType = document.getElementById("dialysisType").value;
  const fluidType = document.getElementById("fluidType").value;
  const volumeIn = parseInt(document.getElementById("volumeIn").value);
  const volumeOut = parseInt(document.getElementById("volumeOut").value);
  const dwellTime = parseFloat(document.getElementById("dwellTime").value || 0);
  const bmCheck = document.getElementById("bmCheck").checked;
  const urineVolume = parseInt(document.getElementById("urineVolume").value || 0);
  const bp = document.getElementById("bp").value;
  const pulse = parseInt(document.getElementById("pulse").value || 0);

  const uf = volumeOut - volumeIn;

  const exchangeRef = ref(db, `patients/${patientId}/exchanges/${datetime}`);
  await set(exchangeRef, {
    datetime,
    dialysisType,
    fluidType,
    volumeIn,
    volumeOut,
    dwellTime,
    ultrafiltration: uf,
    bm: bmCheck,
    urineVolume,
    bp,
    pulse
  });

  form.reset();
});

// Load data and generate charts
function loadData(patientId) {
  const patientRef = ref(db, `patients/${patientId}/exchanges`);
  onValue(patientRef, (snapshot) => {
    const data = snapshot.val();
    if (!data) return;

    const dates = [];
    const ufValues = [];
    const urineValues = [];
    const systolic = [];
    const diastolic = [];
    const pulseValues = [];

    Object.values(data).forEach((entry) => {
      const d = new Date(entry.datetime);
      dates.push(d.toLocaleDateString());
      ufValues.push(entry.ultrafiltration);
      urineValues.push(entry.urineVolume);

      if (entry.bp) {
        const [sys, dia] = entry.bp.split("/").map(Number);
        systolic.push(sys);
        diastolic.push(dia);
      }

      pulseValues.push(entry.pulse);
    });

    if (ufChart) ufChart.destroy();
    if (bpChart) bpChart.destroy();

    ufChart = new Chart(ufChartCtx, {
      type: "line",
      data: {
        labels: dates,
        datasets: [
          {
            label: "Ultrafiltration (mL)",
            data: ufValues,
            borderWidth: 2,
            fill: false,
          },
          {
            label: "Urine Volume (mL)",
            data: urineValues,
            borderWidth: 2,
            fill: false,
          },
        ]
      }
    });

    bpChart = new Chart(bpChartCtx, {
      type: "line",
      data: {
        labels: dates,
        datasets: [
          {
            label: "Systolic BP",
            data: systolic,
            borderWidth: 2,
            fill: false,
          },
          {
            label: "Diastolic BP",
            data: diastolic,
            borderWidth: 2,
            fill: false,
          },
          {
            label: "Pulse",
            data: pulseValues,
            borderWidth: 2,
            fill: false,
          }
        ]
      }
    });
  });
}

patientSelect.addEventListener("change", (e) => {
  loadData(e.target.value);
});

// Initial load
loadData(patientSelect.value);
