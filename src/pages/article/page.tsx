import React, { useState } from "react";
import { ProfileForm } from "@/pages/article/components/articleForm/form";
import AdminEditor from "@/pages/article/components/articleEditor/editor";

export default function DemoPage() {
  const [content, setContent] = useState(null);

  return (
    <>
      <ProfileForm />
      <AdminEditor onChange={setContent} />
    </>
  );
}
