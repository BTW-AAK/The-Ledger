"use client";

import { useRouter, useSearchParams } from "next/navigation";
import OnboardingTutorial from "./OnboardingTutorial";

export default function TutorialGate() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const forceShowTutorial = searchParams.get("tutorial") === "1";

  function closeTutorial() {
    if (forceShowTutorial) {
      router.replace("/");
    }
  }

  return <OnboardingTutorial forceShow={forceShowTutorial} onClose={closeTutorial} />;
}
