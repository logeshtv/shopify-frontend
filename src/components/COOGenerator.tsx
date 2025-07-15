import { Button } from "@/components/ui/button";
import { Download, X } from "lucide-react";
import jsPDF from 'jspdf';

interface Product {
  id: string;
  name: string;
  vendor: string;
  type: string;
}

interface COOGeneratorProps {
  product: Product | null;
  onClose: () => void;
  onGenerated: (product: Product) => void;
}

const generateCertificatePDF = (product: Product) => {
  const doc = new jsPDF();
  
  // Header
  doc.setFontSize(20);
  doc.setFont(undefined, 'bold');
  doc.text('CERTIFICATE OF ORIGIN', 105, 30, { align: 'center' });
  
  // Certificate details
  doc.setFontSize(12);
  doc.setFont(undefined, 'normal');
  
  const currentDate = new Date().toLocaleDateString();
  
  doc.text('Certificate No: COO-' + product.id, 20, 60);
  doc.text('Date: ' + currentDate, 20, 75);
  
  // Product information
  doc.setFont(undefined, 'bold');
  doc.text('PRODUCT INFORMATION', 20, 100);
  doc.setFont(undefined, 'normal');
  
  doc.text('Product Name: ' + product.name, 20, 120);
  doc.text('Product ID: ' + product.id, 20, 135);
  doc.text('Vendor: ' + product.vendor, 20, 150);
  doc.text('Product Type: ' + product.type, 20, 165);
  
  // Origin declaration
  doc.setFont(undefined, 'bold');
  doc.text('DECLARATION OF ORIGIN', 20, 190);
  doc.setFont(undefined, 'normal');
  
  doc.text('I hereby certify that the goods described above originated in:', 20, 210);
  doc.text('Country of Origin: [TO BE SPECIFIED]', 20, 225);
  
  // Signature section
  doc.text('Authorized Signature: ________________________', 20, 250);
  doc.text('Name: ________________________', 20, 265);
  doc.text('Title: ________________________', 20, 280);
  
  // Download the PDF
  doc.save(`Certificate_of_Origin_${product.name.replace(/[^a-zA-Z0-9]/g, '_')}.pdf`);
};

const COOGenerator: React.FC<COOGeneratorProps> = ({ product, onClose, onGenerated }) => {
  if (!product) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg w-full max-w-md p-6">
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-xl font-bold text-gray-900">Generate Certificate of Origin</h2>
          <Button variant="ghost" size="sm" onClick={onClose}>
            <X className="h-4 w-4" />
          </Button>
        </div>
        
        <div className="space-y-4">
          <div>
            <label className="text-sm font-medium text-gray-700">Product ID</label>
            <div className="text-sm text-gray-900 font-mono bg-gray-50 p-2 rounded">
              {product.id}
            </div>
          </div>
          
          <div>
            <label className="text-sm font-medium text-gray-700">Product Name</label>
            <div className="text-sm text-gray-900 bg-gray-50 p-2 rounded">
              {product.name}
            </div>
          </div>
          
          <Button 
            className="w-full bg-blue-600 hover:bg-blue-700"
            onClick={() => {
              generateCertificatePDF(product);
              onGenerated(product);
              onClose();
            }}
          >
            <Download className="h-4 w-4 mr-2" />
            Generate & Download Certificate
          </Button>
        </div>
      </div>
    </div>
  );
};

export default COOGenerator;
