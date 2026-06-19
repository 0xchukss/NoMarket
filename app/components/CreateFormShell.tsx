import type { FormEvent } from "react";

type Props = {
  onSubmit: (e: FormEvent<HTMLFormElement>) => void;
  children: React.ReactNode;
};

export function CreateFormShell({ onSubmit, children }: Props) {
  return (
    <div
      style={{
        maxWidth: "1100px",
        margin: "0 auto",
        padding: "0 20px 96px",
      }}
    >
      <form
        onSubmit={onSubmit}
        style={{
          display: "grid",
          gridTemplateColumns: "1fr 300px",
          gap: "32px",
          alignItems: "flex-start",
        }}
      >
        {children}
      </form>
    </div>
  );
}
