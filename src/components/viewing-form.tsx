import { useState } from "react";
import { useServerFn } from "@tanstack/react-start";
import { createBooking } from "@/lib/properties.functions";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";
import { Loader2 } from "lucide-react";
import { BRAND } from "@/lib/constants";
import { buildWhatsAppUrl } from "@/lib/whatsapp";

export function ViewingForm({
  propertyId,
  propertyTitle,
  whatsapp,
}: {
  propertyId: string;
  propertyTitle?: string;
  whatsapp?: string | null;
}) {
  const submit = useServerFn(createBooking);
  const [loading, setLoading] = useState(false);

  async function onSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const form = e.currentTarget;
    const fd = new FormData(form);

    const name = String(fd.get("name")).trim();
    const email = String(fd.get("email")).trim();
    const phone = (fd.get("phone") as string)?.trim() || null;
    const date = String(fd.get("date"));
    const time = String(fd.get("time"));
    const notes = (fd.get("notes") as string)?.trim() || null;

    const requested = new Date(`${date}T${time}`);
    if (requested.getTime() <= Date.now()) {
      toast.error("Please choose a future date and time.");
      return;
    }

    setLoading(true);
    try {
      await submit({
        data: {
          client_name: name,
          client_email: email,
          client_phone: phone,
          property_id: propertyId,
          requested_at: requested.toISOString(),
          notes,
        },
      });

      const formattedDate = requested.toLocaleDateString("en-GB", {
        weekday: "long",
        day: "numeric",
        month: "long",
        year: "numeric",
      });
      const formattedTime = requested.toLocaleTimeString("en-GB", {
        hour: "2-digit",
        minute: "2-digit",
      });

      const lines = [
        `Hello, I'd like to schedule a viewing via ${BRAND.name}.`,
        "",
        propertyTitle ? `*Property:* ${propertyTitle}` : null,
        `*Preferred Date:* ${formattedDate}`,
        `*Preferred Time:* ${formattedTime}`,
        "",
        `*Name:* ${name}`,
        `*Email:* ${email}`,
        phone ? `*Phone:* ${phone}` : null,
        notes ? `\n*Notes:*\n${notes}` : null,
        "",
        "Please confirm the viewing at your earliest convenience. Thank you!",
      ];

      const wa = buildWhatsAppUrl(whatsapp, lines);
      window.open(wa, "_blank", "noopener");
      toast.success("Viewing request sent — redirecting you to WhatsApp.");
      form.reset();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Could not schedule viewing");
    } finally {
      setLoading(false);
    }
  }

  const minDate = new Date(Date.now() + 86400000).toISOString().slice(0, 10);

  return (
    <form onSubmit={onSubmit} className="space-y-4">
      <div className="grid gap-4 sm:grid-cols-2">
        <div className="space-y-1.5">
          <Label htmlFor="v-name">Name</Label>
          <Input id="v-name" name="name" required />
        </div>
        <div className="space-y-1.5">
          <Label htmlFor="v-email">Email</Label>
          <Input id="v-email" name="email" type="email" required />
        </div>
      </div>
      <div className="space-y-1.5">
        <Label htmlFor="v-phone">Phone</Label>
        <Input id="v-phone" name="phone" type="tel" />
      </div>
      <div className="grid gap-4 sm:grid-cols-2">
        <div className="space-y-1.5">
          <Label htmlFor="date">Preferred date</Label>
          <Input id="date" name="date" type="date" required min={minDate} />
        </div>
        <div className="space-y-1.5">
          <Label htmlFor="time">Time</Label>
          <Input id="time" name="time" type="time" required />
        </div>
      </div>
      <div className="space-y-1.5">
        <Label htmlFor="notes">Notes</Label>
        <Textarea id="notes" name="notes" rows={3} placeholder="Accessibility, party size, etc." />
      </div>
      <Button
        type="submit"
        disabled={loading}
        className="w-full rounded-full bg-neutral-900 font-semibold uppercase tracking-wider text-white hover:bg-neutral-800"
      >
        {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
        Request viewing
      </Button>
    </form>
  );
}
