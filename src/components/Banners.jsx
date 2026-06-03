import { AlertTriangle, PhoneCall, PhoneOff } from "lucide-react";

function Banner({ tone, icon: Icon, title, body }) {
  const styles = {
    orange: "border-mho/40 bg-mho/10 text-mho",
    green: "border-filled/40 bg-filled/10 text-filled",
    red: "border-alert/40 bg-alert/10 text-alert",
  }[tone];

  return (
    <div className={`flex items-start gap-3 rounded-sm border ${styles} px-4 py-2`}>
      <Icon size={16} className="mt-[3px] shrink-0" />
      <div className="leading-tight">
        <div className="mono text-[11px] uppercase tracking-[0.18em]">{title}</div>
        <div className="mt-0.5 text-[13px] text-txt-primary/90">{body}</div>
      </div>
    </div>
  );
}

export default function Banners({ splitNotice, callbackStatus }) {
  if (!splitNotice && !callbackStatus) return null;
  return (
    <div className="mx-auto max-w-[1200px] space-y-2 px-7 pt-4">
      {splitNotice && (
        <Banner
          tone="orange"
          icon={AlertTriangle}
          title="12-Hour MHO Max Rule Triggered"
          body={splitNotice}
        />
      )}
      {callbackStatus && (
        <Banner
          tone={callbackStatus.empty ? "red" : "green"}
          icon={callbackStatus.empty ? PhoneOff : PhoneCall}
          title={callbackStatus.empty ? "Callback List Empty" : "Callback Resources Available"}
          body={`Pre-1200: ${callbackStatus.pre} member${callbackStatus.pre === 1 ? "" : "s"} - After-1200: ${callbackStatus.post} member${callbackStatus.post === 1 ? "" : "s"}`}
        />
      )}
    </div>
  );
}
