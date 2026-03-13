import { useState } from "react";
import { Eye, EyeOff, Download, RefreshCw } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { cn } from "@/lib/utils";
import { toast } from "sonner";

interface DataRecord {
  id: number;
  name: string;
  email: string;
  phone: string;
  ssn: string;
  address: string;
  dob: string;
  aadhaar: string;
  pan: string;
  passport: string;
  creditCard: string;
  bankAccount: string;
  ifsc: string;
  upiId: string;
  pinCode: string;
  ipAddress: string;
}

const sampleData: DataRecord[] = [
  {
    id: 1,
    name: "John Smith",
    email: "john.smith@email.com",
    phone: "+91-98765-43210",
    ssn: "123-45-6789",
    address: "123 Main St, New York, NY 10001",
    dob: "1990-05-15",
    aadhaar: "1234-5678-9012",
    pan: "ABCDE1234F",
    passport: "P12345678",
    creditCard: "4532-1234-5678-9012",
    bankAccount: "12345678901234",
    ifsc: "HDFC0001234",
    upiId: "john.smith@upi",
    pinCode: "600001",
    ipAddress: "192.168.1.101",
  },
  {
    id: 2,
    name: "Sarah Johnson",
    email: "sarah.j@company.org",
    phone: "+91-87654-32109",
    ssn: "987-65-4321",
    address: "456 Oak Ave, Los Angeles, CA 90001",
    dob: "1985-11-22",
    aadhaar: "9876-5432-1098",
    pan: "XYZAB5678C",
    passport: "P87654321",
    creditCard: "5412-9876-5432-1098",
    bankAccount: "98765432109876",
    ifsc: "ICIC0005678",
    upiId: "sarah.j@okaxis",
    pinCode: "400001",
    ipAddress: "10.0.0.55",
  },
  {
    id: 3,
    name: "Michael Chen",
    email: "m.chen@business.net",
    phone: "+91-76543-21098",
    ssn: "456-78-9012",
    address: "789 Pine Rd, Chicago, IL 60601",
    dob: "1992-08-30",
    aadhaar: "5678-1234-9087",
    pan: "LMNOP9012Q",
    passport: "P56781234",
    creditCard: "3782-8224-6310-0052",
    bankAccount: "56781234098765",
    ifsc: "SBIN0009012",
    upiId: "michael.c@paytm",
    pinCode: "110001",
    ipAddress: "172.16.0.22",
  },
  {
    id: 4,
    name: "Emily Davis",
    email: "emily.davis@mail.com",
    phone: "+91-65432-10987",
    ssn: "321-09-8765",
    address: "321 Elm Blvd, Houston, TX 77001",
    dob: "1988-02-14",
    aadhaar: "3456-7890-1234",
    pan: "QRSTU3456V",
    passport: "P34567890",
    creditCard: "6011-1234-5678-9012",
    bankAccount: "34567890123456",
    ifsc: "AXIS0003456",
    upiId: "emily.d@gpay",
    pinCode: "500001",
    ipAddress: "192.168.0.150",
  },
];

// Masking functions for each technique
const maskingTechniques: Record<string, Record<string, (value: string) => string>> = {
  partial: {
    name: (val) => {
      const parts = val.split(" ");
      return parts.map(p => p[0] + "***" + (p.length > 1 ? p.slice(-1) : "")).join(" ");
    },
    email: (val) => {
      const [local, domain] = val.split("@");
      const [domainName, ext] = domain.split(".");
      return local.slice(0, 2) + "****@" + domainName.slice(0, 2) + "***." + ext;
    },
    phone: (val) => val.slice(0, 4) + "*****" + val.slice(-4),
    ssn: (val) => "***-**-" + val.slice(-4),
    address: (val) => {
      const parts = val.split(", ");
      return "*** " + parts[0].split(" ").slice(-1)[0] + ", " + parts.slice(1).join(", ");
    },
    dob: (val) => "****-**-" + val.slice(-4),
    aadhaar: (val) => "XXXX-XXXX-" + val.slice(-4),
    pan: (val) => val.slice(0, 5) + "****" + val.slice(-1),
    passport: (val) => val[0] + "******" + val.slice(-2),
    creditCard: (val) => "**** **** **** " + val.slice(-4),
    bankAccount: (val) => "******" + val.slice(-4),
    ifsc: (val) => val.slice(0, 4) + "0****" + val.slice(-2),
    upiId: (val) => {
      const [name, provider] = val.split("@");
      return name.slice(0, 2) + "****@" + provider;
    },
    pinCode: (val) => val.slice(0, 2) + "***",
    ipAddress: (val) => {
      const parts = val.split(".");
      return parts[0] + "." + parts[1] + ".*.*";
    },
  },
  full: {
    name: (val) => "*".repeat(val.length),
    email: (val) => "*".repeat(val.length),
    phone: (val) => "*".repeat(val.length),
    ssn: (val) => "*".repeat(val.length),
    address: (val) => "*".repeat(Math.min(val.length, 20)) + "...",
    dob: () => "**********",
    aadhaar: () => "****-****-****",
    pan: () => "**********",
    passport: () => "*********",
    creditCard: () => "****-****-****-****",
    bankAccount: () => "**************",
    ifsc: () => "***********",
    upiId: (val) => "*".repeat(val.length),
    pinCode: () => "******",
    ipAddress: () => "***.***.***.***",
  },
  redact: {
    name: () => "[REDACTED]",
    email: () => "[REDACTED]",
    phone: () => "[REDACTED]",
    ssn: () => "[REDACTED]",
    address: () => "[REDACTED]",
    dob: () => "[REDACTED]",
    aadhaar: () => "[REDACTED]",
    pan: () => "[REDACTED]",
    passport: () => "[REDACTED]",
    creditCard: () => "[REDACTED]",
    bankAccount: () => "[REDACTED]",
    ifsc: () => "[REDACTED]",
    upiId: () => "[REDACTED]",
    pinCode: () => "[REDACTED]",
    ipAddress: () => "[REDACTED]",
  },
  tokenize: {
    name: () => "TOK_" + Math.random().toString(36).slice(2, 7).toUpperCase(),
    email: () => "TOK_" + Math.random().toString(36).slice(2, 7).toUpperCase(),
    phone: () => "TOK_" + Math.random().toString(36).slice(2, 7).toUpperCase(),
    ssn: () => "TOK_" + Math.random().toString(36).slice(2, 7).toUpperCase(),
    address: () => "TOK_" + Math.random().toString(36).slice(2, 7).toUpperCase(),
    dob: () => "TOK_" + Math.random().toString(36).slice(2, 7).toUpperCase(),
    aadhaar: () => "TOK_" + Math.random().toString(36).slice(2, 7).toUpperCase(),
    pan: () => "TOK_" + Math.random().toString(36).slice(2, 7).toUpperCase(),
    passport: () => "TOK_" + Math.random().toString(36).slice(2, 7).toUpperCase(),
    creditCard: () => "TOK_" + Math.random().toString(36).slice(2, 7).toUpperCase(),
    bankAccount: () => "TOK_" + Math.random().toString(36).slice(2, 7).toUpperCase(),
    ifsc: () => "TOK_" + Math.random().toString(36).slice(2, 7).toUpperCase(),
    upiId: () => "TOK_" + Math.random().toString(36).slice(2, 7).toUpperCase(),
    pinCode: () => "TOK_" + Math.random().toString(36).slice(2, 7).toUpperCase(),
    ipAddress: () => "TOK_" + Math.random().toString(36).slice(2, 7).toUpperCase(),
  },
  hash: {
    name: (val) => {
      const hash = btoa(val).slice(0, 4) + "..." + btoa(val).slice(-3);
      return hash.toLowerCase();
    },
    email: (val) => btoa(val).slice(0, 4).toLowerCase() + "..." + btoa(val).slice(-3).toLowerCase(),
    phone: (val) => btoa(val).slice(0, 4).toLowerCase() + "..." + btoa(val).slice(-3).toLowerCase(),
    ssn: (val) => btoa(val).slice(0, 4).toLowerCase() + "..." + btoa(val).slice(-3).toLowerCase(),
    address: (val) => btoa(val).slice(0, 4).toLowerCase() + "..." + btoa(val).slice(-3).toLowerCase(),
    dob: (val) => btoa(val).slice(0, 4).toLowerCase() + "..." + btoa(val).slice(-3).toLowerCase(),
    aadhaar: (val) => btoa(val).slice(0, 4).toLowerCase() + "..." + btoa(val).slice(-3).toLowerCase(),
    pan: (val) => btoa(val).slice(0, 4).toLowerCase() + "..." + btoa(val).slice(-3).toLowerCase(),
    passport: (val) => btoa(val).slice(0, 4).toLowerCase() + "..." + btoa(val).slice(-3).toLowerCase(),
    creditCard: (val) => btoa(val).slice(0, 4).toLowerCase() + "..." + btoa(val).slice(-3).toLowerCase(),
    bankAccount: (val) => btoa(val).slice(0, 4).toLowerCase() + "..." + btoa(val).slice(-3).toLowerCase(),
    ifsc: (val) => btoa(val).slice(0, 4).toLowerCase() + "..." + btoa(val).slice(-3).toLowerCase(),
    upiId: (val) => btoa(val).slice(0, 4).toLowerCase() + "..." + btoa(val).slice(-3).toLowerCase(),
    pinCode: (val) => btoa(val).slice(0, 4).toLowerCase() + "..." + btoa(val).slice(-3).toLowerCase(),
    ipAddress: (val) => btoa(val).slice(0, 4).toLowerCase() + "..." + btoa(val).slice(-3).toLowerCase(),
  },
  random: {
    name: () => {
      const firstNames = ["Alex", "Jordan", "Taylor", "Morgan", "Casey", "Riley", "Quinn"];
      const lastNames = ["Smith", "Johnson", "Williams", "Brown", "Jones", "Miller"];
      return firstNames[Math.floor(Math.random() * firstNames.length)] + " " + 
             lastNames[Math.floor(Math.random() * lastNames.length)];
    },
    email: () => `user${Math.floor(Math.random() * 10000)}@example.com`,
    phone: () => `+91-${Math.floor(10000 + Math.random() * 90000)}-${Math.floor(10000 + Math.random() * 90000)}`,
    ssn: () => `${Math.floor(100 + Math.random() * 900)}-${Math.floor(10 + Math.random() * 90)}-${Math.floor(1000 + Math.random() * 9000)}`,
    address: () => `${Math.floor(100 + Math.random() * 900)} Random St, City, ST ${Math.floor(10000 + Math.random() * 90000)}`,
    dob: () => `${1970 + Math.floor(Math.random() * 40)}-${String(Math.floor(1 + Math.random() * 12)).padStart(2, '0')}-${String(Math.floor(1 + Math.random() * 28)).padStart(2, '0')}`,
    aadhaar: () => `${Math.floor(1000 + Math.random() * 9000)}-${Math.floor(1000 + Math.random() * 9000)}-${Math.floor(1000 + Math.random() * 9000)}`,
    pan: () => {
      const letters = "ABCDEFGHIJKLMNOPQRSTUVWXYZ";
      return Array(5).fill(0).map(() => letters[Math.floor(Math.random() * 26)]).join("") + 
             Math.floor(1000 + Math.random() * 9000) + letters[Math.floor(Math.random() * 26)];
    },
    passport: () => "P" + Math.floor(10000000 + Math.random() * 90000000),
    creditCard: () => `${Math.floor(1000 + Math.random() * 9000)}-${Math.floor(1000 + Math.random() * 9000)}-${Math.floor(1000 + Math.random() * 9000)}-${Math.floor(1000 + Math.random() * 9000)}`,
    bankAccount: () => String(Math.floor(10000000000000 + Math.random() * 90000000000000)),
    ifsc: () => {
      const banks = ["HDFC", "ICIC", "SBIN", "AXIS", "KOTAK"];
      return banks[Math.floor(Math.random() * banks.length)] + "0" + String(Math.floor(100000 + Math.random() * 900000)).slice(0, 6);
    },
    upiId: () => {
      const providers = ["@upi", "@okaxis", "@paytm", "@gpay", "@ybl"];
      return `user${Math.floor(1000 + Math.random() * 9000)}${providers[Math.floor(Math.random() * providers.length)]}`;
    },
    pinCode: () => String(Math.floor(100000 + Math.random() * 900000)),
    ipAddress: () => `${Math.floor(1 + Math.random() * 254)}.${Math.floor(1 + Math.random() * 254)}.${Math.floor(1 + Math.random() * 254)}.${Math.floor(1 + Math.random() * 254)}`,
  },
  formatPreserving: {
    name: (val) => {
      const parts = val.split(" ");
      return parts.map(p => p[0] + "x".repeat(p.length - 1)).join(" ");
    },
    email: (val) => {
      const [local, domain] = val.split("@");
      return "x".repeat(local.length) + "@" + "x".repeat(domain.split(".")[0].length) + "." + domain.split(".")[1];
    },
    phone: (val) => val.replace(/\d/g, "0"),
    ssn: () => "000-00-0000",
    address: (val) => val.replace(/\d/g, "0").replace(/[a-zA-Z]/g, "X"),
    dob: () => "0000-00-00",
    aadhaar: () => "0000-0000-0000",
    pan: () => "XXXXX0000X",
    passport: () => "X00000000",
    creditCard: () => "0000-0000-0000-0000",
    bankAccount: (val) => "0".repeat(val.length),
    ifsc: () => "XXXX0000000",
    upiId: (val) => {
      const [, provider] = val.split("@");
      return "xxxxxx@" + provider;
    },
    pinCode: () => "000000",
    ipAddress: () => "0.0.0.0",
  },
};

const piiTypes: Record<keyof Omit<DataRecord, "id">, string> = {
  name: "Name",
  email: "Email",
  phone: "Phone",
  ssn: "SSN",
  address: "Address",
  dob: "DOB",
  aadhaar: "Aadhaar",
  pan: "PAN",
  passport: "Passport",
  creditCard: "Credit Card",
  bankAccount: "Bank A/C",
  ifsc: "IFSC",
  upiId: "UPI ID",
  pinCode: "PIN Code",
  ipAddress: "IP Address",
};

export const DataPreview = () => {
  const [showMasked, setShowMasked] = useState(true);
  const [selectedMethod, setSelectedMethod] = useState("default");
  const [selectedFields, setSelectedFields] = useState<Set<string>>(
    new Set(["email", "phone", "ssn", "aadhaar", "pan", "creditCard"])
  );

  const toggleField = (field: string) => {
    const newFields = new Set(selectedFields);
    if (newFields.has(field)) {
      newFields.delete(field);
    } else {
      newFields.add(field);
    }
    setSelectedFields(newFields);
  };

  const getEffectiveMethod = () => {
    // If default or no method selected, use partial as fallback when masking is on
    return selectedMethod === "default" || !selectedMethod ? "partial" : selectedMethod;
  };

  const getMaskedValue = (field: string, value: string) => {
    if (!showMasked || !selectedFields.has(field)) return value;
    const method = getEffectiveMethod();
    const technique = maskingTechniques[method];
    if (technique && technique[field]) {
      return technique[field](value);
    }
    return value;
  };

  const getCellStyle = (field: string) => {
    if (showMasked && selectedFields.has(field)) {
      return "bg-primary/5 text-primary font-mono";
    }
    return "";
  };

  const handleExport = () => {
    const method = getEffectiveMethod();
    
    // Build CSV header
    const headers = ["ID", "Name", "Email", "Phone", "SSN", "Address", "DOB", "Aadhaar", "PAN", "Passport", "Credit Card", "Bank Account", "IFSC", "UPI ID", "PIN Code", "IP Address"];
    
    // Build CSV rows
    const rows = sampleData.map(record => {
      const getValue = (field: keyof Omit<DataRecord, "id">) => {
        if (showMasked && selectedFields.has(field)) {
          const technique = maskingTechniques[method];
          if (technique && technique[field]) {
            return technique[field](record[field]);
          }
        }
        return record[field];
      };
      
      return [
        record.id,
        getValue("name"),
        getValue("email"),
        getValue("phone"),
        getValue("ssn"),
        getValue("address"),
        getValue("dob"),
        getValue("aadhaar"),
        getValue("pan"),
        getValue("passport"),
        getValue("creditCard"),
        getValue("bankAccount"),
        getValue("ifsc"),
        getValue("upiId"),
        getValue("pinCode"),
        getValue("ipAddress"),
      ].map(val => `"${String(val).replace(/"/g, '""')}"`).join(",");
    });
    
    const csvContent = [headers.join(","), ...rows].join("\n");
    
    // Create and trigger download
    const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
    const link = document.createElement("a");
    const date = new Date().toISOString().split("T")[0];
    link.href = URL.createObjectURL(blob);
    link.download = `masked_data_${date}.csv`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(link.href);
    
    toast.success("Masked data exported successfully!");
  };

  return (
    <Card className="glass-effect">
      <CardHeader>
        <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
          <div>
            <CardTitle className="flex items-center gap-2">
              {showMasked ? (
                <EyeOff className="h-5 w-5 text-primary" />
              ) : (
                <Eye className="h-5 w-5 text-primary" />
              )}
              Data Preview
            </CardTitle>
            <CardDescription>
              Preview your data with masking applied
            </CardDescription>
          </div>
          <div className="flex items-center gap-4">
            <div className="flex items-center gap-2">
              <Switch
                id="mask-toggle"
                checked={showMasked}
                onCheckedChange={setShowMasked}
              />
              <Label htmlFor="mask-toggle" className="text-sm">
                Show Masked
              </Label>
            </div>
          </div>
        </div>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Controls */}
        <div className="flex flex-wrap gap-4">
          <div className="space-y-2">
            <Label>Masking Method</Label>
            <Select value={selectedMethod} onValueChange={setSelectedMethod}>
              <SelectTrigger className="w-[220px]">
                <SelectValue placeholder="Select Masking Method" />
              </SelectTrigger>
              <SelectContent className="bg-popover z-50">
                <SelectItem value="default">Default</SelectItem>
                <SelectItem value="partial">Partial Mask</SelectItem>
                <SelectItem value="full">Full Mask</SelectItem>
                <SelectItem value="redact">Redaction ([REDACTED])</SelectItem>
                <SelectItem value="tokenize">Tokenization (TOK_xxxxx)</SelectItem>
                <SelectItem value="hash">Hashing (a9f3...c12)</SelectItem>
                <SelectItem value="random">Random Replacement</SelectItem>
                <SelectItem value="formatPreserving">Format Preserving Mask</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label>Fields to Mask</Label>
            <div className="flex flex-wrap gap-2">
              {Object.entries(piiTypes).map(([key, label]) => (
                <Badge
                  key={key}
                  variant={selectedFields.has(key) ? "default" : "outline"}
                  className={cn(
                    "cursor-pointer transition-all",
                    selectedFields.has(key) && "gradient-primary"
                  )}
                  onClick={() => toggleField(key)}
                >
                  {label}
                </Badge>
              ))}
            </div>
          </div>
        </div>

        {/* Data Table */}
        <div className="rounded-lg border overflow-x-auto">
          <Table>
            <TableHeader>
              <TableRow className="bg-secondary/50">
                <TableHead className="w-16">ID</TableHead>
                <TableHead>Name</TableHead>
                <TableHead>Email</TableHead>
                <TableHead>Phone</TableHead>
                <TableHead>SSN</TableHead>
                <TableHead>Address</TableHead>
                <TableHead>DOB</TableHead>
                <TableHead>Aadhaar</TableHead>
                <TableHead>PAN</TableHead>
                <TableHead>Passport</TableHead>
                <TableHead>Credit Card</TableHead>
                <TableHead>Bank A/C</TableHead>
                <TableHead>IFSC</TableHead>
                <TableHead>UPI ID</TableHead>
                <TableHead>PIN Code</TableHead>
                <TableHead>IP Address</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {sampleData.map((record) => (
                <TableRow key={record.id} className="hover:bg-secondary/30">
                  <TableCell className="font-medium">{record.id}</TableCell>
                  <TableCell className={getCellStyle("name")}>
                    {getMaskedValue("name", record.name)}
                  </TableCell>
                  <TableCell className={getCellStyle("email")}>
                    {getMaskedValue("email", record.email)}
                  </TableCell>
                  <TableCell className={getCellStyle("phone")}>
                    {getMaskedValue("phone", record.phone)}
                  </TableCell>
                  <TableCell className={getCellStyle("ssn")}>
                    {getMaskedValue("ssn", record.ssn)}
                  </TableCell>
                  <TableCell className={getCellStyle("address")}>
                    {getMaskedValue("address", record.address)}
                  </TableCell>
                  <TableCell className={getCellStyle("dob")}>
                    {getMaskedValue("dob", record.dob)}
                  </TableCell>
                  <TableCell className={getCellStyle("aadhaar")}>
                    {getMaskedValue("aadhaar", record.aadhaar)}
                  </TableCell>
                  <TableCell className={getCellStyle("pan")}>
                    {getMaskedValue("pan", record.pan)}
                  </TableCell>
                  <TableCell className={getCellStyle("passport")}>
                    {getMaskedValue("passport", record.passport)}
                  </TableCell>
                  <TableCell className={getCellStyle("creditCard")}>
                    {getMaskedValue("creditCard", record.creditCard)}
                  </TableCell>
                  <TableCell className={getCellStyle("bankAccount")}>
                    {getMaskedValue("bankAccount", record.bankAccount)}
                  </TableCell>
                  <TableCell className={getCellStyle("ifsc")}>
                    {getMaskedValue("ifsc", record.ifsc)}
                  </TableCell>
                  <TableCell className={getCellStyle("upiId")}>
                    {getMaskedValue("upiId", record.upiId)}
                  </TableCell>
                  <TableCell className={getCellStyle("pinCode")}>
                    {getMaskedValue("pinCode", record.pinCode)}
                  </TableCell>
                  <TableCell className={getCellStyle("ipAddress")}>
                    {getMaskedValue("ipAddress", record.ipAddress)}
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>

        {/* Actions */}
        <div className="flex gap-3">
          <Button className="gradient-primary" onClick={handleExport}>
            <Download className="mr-2 h-4 w-4" />
            Export Masked Data
          </Button>
          <Button variant="outline" onClick={() => toast.info("Re-scanning data...")}>
            <RefreshCw className="mr-2 h-4 w-4" />
            Re-scan Data
          </Button>
        </div>
      </CardContent>
    </Card>
  );
};
