"use client";

import { useEffect } from "react";
import { useParams, useRouter, useSearchParams } from "next/navigation";

export default function LessonTheoryRedirect() {
  const router = useRouter();
  const { slug } = useParams<{ slug: string }>();
  const searchParams = useSearchParams();

  useEffect(() => {
    const previewParam = searchParams.get("preview");
    const target = `/lessons/${slug}${previewParam ? `?preview=${previewParam}` : ""}`;
    router.replace(target);
  }, [router, slug, searchParams]);

  return null;
}
