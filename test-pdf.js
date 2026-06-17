import { jsPDF } from 'jspdf';
import jsPDFDefault from 'jspdf';

console.log("jsPDF named export:", typeof jsPDF);
console.log("jsPDF default export:", typeof jsPDFDefault);

try {
  const doc = new jsPDFDefault();
  console.log("Success with default export");
} catch(e) {
  console.log("Error with default export:", e.message);
}

try {
  const doc = new jsPDF();
  console.log("Success with named export");
} catch(e) {
  console.log("Error with named export:", e.message);
}
