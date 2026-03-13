import { Layout } from "@/components/layout/Layout";
import { FileUpload } from "@/components/upload/FileUpload";

const UploadPage = () => {
  return (
    <Layout>
      <div className="space-y-6">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">File Upload</h1>
          <p className="text-muted-foreground mt-1">
            Upload files to scan for PII and apply masking
          </p>
        </div>

        <div>
          <FileUpload />
        </div>
      </div>
    </Layout>
  );
};

export default UploadPage;
