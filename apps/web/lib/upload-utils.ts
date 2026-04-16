import { apiClient } from "./api";

export async function uploadImage(
  file: File, 
  presignMutation: (vars: { key: string; content_type: string }) => Promise<{ presigned_url: string; public_url: string }>
): Promise<string> {
  const ext = file.name.split(".").pop() ?? "jpg";
  const key = `uploads/${crypto.randomUUID()}.${ext}`;
  const { presigned_url, public_url } = await presignMutation({
    key,
    content_type: file.type,
  });
  
  await apiClient.put(presigned_url, file, {
    headers: { "Content-Type": file.type },
    withCredentials: false,
    baseURL: "",
  });
  
  return public_url;
}

export function handlePasteImage(
  e: React.ClipboardEvent, 
  onUpload: (file: File) => Promise<void>
) {
  const items = e.clipboardData.items;
  for (let i = 0; i < items.length; i++) {
    if (items[i].type.indexOf("image") !== -1) {
      const file = items[i].getAsFile();
      if (file) {
        onUpload(file);
        e.preventDefault();
      }
    }
  }
}
