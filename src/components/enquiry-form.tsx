import { useState } from "react";
import { useServerFn } from "@tanstack/react-start";
import { createLead } from "@/lib/properties.functions";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";
import { Loader2 } from "lucide-react";
import {
  buildGeneralEnquiryLines,
  buildPropertyEnquiryLines,
  buildWhatsAppUrl,
  type PropertyWhatsAppContext,
} from "@/lib/whatsapp";

export function EnquiryForm({
  propertyId,
  propertyTitle,
  propertyContext,
  whatsapp,
  source = "enquiry",
}: {
  propertyId?: string;
  propertyTitle?: string;
  propertyContext?: PropertyWhatsAppContext;
  whatsapp?: string | null;
  source?: "enquiry" | "contact";
}) {
  const submit = useServerFn(createLead);
  const [loading, setLoading] = useState(false);

  async function onSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const form = e.currentTarget;
    const fd = new FormData(form);

    const name = String(fd.get("name")).trim();
    const email = String(fd.get("email")).trim();
    const phone = (fd.get("phone") as string)?.trim() || null;
    const message = (fd.get("message") as string)?.trim() || null;

    setLoading(true);
    try {
      await submit({
        data: {
          client_name: name,
          client_email: email,
          client_phone: phone,
          message,
          source,
          property_id: propertyId ?? null,
        },
      });

      const lines =
        propertyContext || propertyTitle
          ? buildPropertyEnquiryLines(
              propertyContext ?? { title: propertyTitle! },
              { name, email, phone, message },
            )
          : buildGeneralEnquiryLines({ name, email, phone, message });

      const wa = buildWhatsAppUrl(whatsapp, lines);
      window.open(wa, "_blank", "noopener");
      toast.success("Enquiry sent — redirecting you to WhatsApp.");
      form.reset();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Could not send enquiry");
    } finally {
      setLoading(false);
    }
  }

  return (
    <form onSubmit={onSubmit} className="space-y-4">
      <div className="grid gap-4 sm:grid-cols-2">
        <div className="space-y-1.5">
          <Label htmlFor="name">Name</Label>
          <Input id="name" name="name" required maxLength={200} />
        </div>
        <div className="space-y-1.5">
          <Label htmlFor="email">Email</Label>
          <Input id="email" name="email" type="email" required maxLength={320} />
        </div>
      </div>
      <div className="space-y-1.5">
        <Label htmlFor="phone">Phone (optional)</Label>
        <Input id="phone" name="phone" type="tel" maxLength={40} />
      </div>
      <div className="space-y-1.5">
        <Label htmlFor="message">Message</Label>
        <Textarea id="message" name="message" rows={4} maxLength={5000} placeholder="Budget, preferred areas, move-in date — whatever helps us point you the right way…" />
      </div>
      <Button
        type="submit"
        disabled={loading}
        className="w-full rounded-full bg-neutral-900 font-semibold uppercase tracking-wider text-white hover:bg-neutral-800"
      >
        {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
        Send via WhatsApp
      </Button>
    </form>
  );
}
