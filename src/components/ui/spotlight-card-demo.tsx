import { GlowCard } from "@/components/ui/spotlight-card";

// Reference demo from the component source (not rendered on the site).
// GlowCard requires children, so each card gets an empty fragment.
export function Default(){
  return(
    <div className="w-screen h-screen flex flex-row items-center justify-center gap-10 custom-cursor">
      <GlowCard><></></GlowCard>
      <GlowCard><></></GlowCard>
      <GlowCard><></></GlowCard>
    </div>
  );
};
