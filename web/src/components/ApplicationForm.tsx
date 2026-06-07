import { useEffect, useRef, useState, type FormEvent } from "react";
import { getSubmitUrl } from "../config";
// Side-effect import: registers the <altcha-widget> custom element. The widget
// fetches a signed proof-of-work challenge from the Lambda (GET) and solves it
// in the browser; the Lambda verifies the solution on submit (POST). See
// doc/lambda.md (Tier 1A).
import "altcha";

// The challenge endpoint is the same Lambda Function URL the form POSTs to; a
// GET returns a fresh ALTCHA challenge.
const challengeUrl = getSubmitUrl();

/**
 * The application form. On submit it POSTs
 * { email, motivation, acknowledged, altcha } to the Lambda Function URL (read
 * at runtime from window.__VTTU_CONFIG__; see ../config.ts), which verifies the
 * ALTCHA solution and stores the submission in DynamoDB.
 */
export function ApplicationForm() {
  const [email, setEmail] = useState("");
  const [motivation, setMotivation] = useState("");
  const [acknowledged, setAcknowledged] = useState(false);
  // Honeypot: hidden from real users, so it should always stay empty. Bots that
  // fill every field trip it and the Lambda rejects the submission.
  const [website, setWebsite] = useState("");
  // The base64 ALTCHA solution the widget produces once it verifies. Empty until
  // the user solves the challenge; the Lambda rejects submissions without it.
  const [altcha, setAltcha] = useState("");
  const [status, setStatus] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const widgetRef = useRef<HTMLElement>(null);

  // Mirror the widget's verification state into `altcha`. It emits `statechange`
  // with the solution payload once verified, and reverts on expiry/error.
  useEffect(() => {
    const widget = widgetRef.current;
    if (!widget) return;
    function onStateChange(event: Event) {
      const detail = (event as CustomEvent<{ state?: string; payload?: string }>).detail;
      setAltcha(detail?.state === "verified" && detail.payload ? detail.payload : "");
    }
    widget.addEventListener("statechange", onStateChange);
    return () => widget.removeEventListener("statechange", onStateChange);
  }, []);

  function resetWidget() {
    setAltcha("");
    (widgetRef.current as { reset?: () => void } | null)?.reset?.();
  }

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (submitting) return;

    setStatus(null);
    setError(null);

    if (!challengeUrl) {
      setError("Lomakkeen lähetys ei ole käytettävissä juuri nyt.");
      return;
    }

    setSubmitting(true);
    try {
      const response = await fetch(challengeUrl, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, motivation, acknowledged, website, altcha }),
      });
      if (!response.ok) {
        throw new Error(`Request failed with status ${response.status}`);
      }
      setStatus("Kiitos! Hakemuksesi on nyt VTTU töissä!");
      setEmail("");
      setMotivation("");
      setAcknowledged(false);
      setWebsite("");
      // The solution is single-use server-side; force a fresh one for any
      // subsequent submission.
      resetWidget();
    } catch {
      setError("Lähetys epäonnistui. Yritä myöhemmin uudelleen.");
      resetWidget();
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <form className="border border-white-300" onSubmit={handleSubmit} noValidate>
      {/*
        Honeypot field. Hidden off-screen rather than with display:none (some
        bots skip hidden fields) and kept out of the tab order and a11y tree.
        Real users never fill it; the Lambda rejects any non-empty value.
      */}
      <div className="absolute left-[-9999px] top-[-9999px] h-0 w-0 overflow-hidden" aria-hidden="true">
        <label htmlFor="website">Kotisivu</label>
        <input
          id="website"
          name="website"
          type="text"
          tabIndex={-1}
          autoComplete="off"
          value={website}
          onChange={(e) => setWebsite(e.target.value)}
        />
      </div>

      <div className="border-b border-white-300 bg-white-050 p-6">
        <label htmlFor="email" className="block font-semibold text-ink-900">
          Sähköposti
        </label>
        <input
          id="email"
          name="email"
          type="email"
          required
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          placeholder="etunimi.sukunimi@esimerkki.fi"
          autoComplete="email"
          className="mt-2 w-full rounded-sm border border-white-300 bg-white-050 px-3 py-2 text-ink-900 outline-none transition-colors duration-150 placeholder:text-ink-500 focus-visible:border-orange-500 focus-visible:outline-2 focus-visible:outline-orange-500"
        />
        <p className="mt-2 text-[0.8rem] text-ink-500">Pakollinen kenttä.</p>
      </div>

      <div className="bg-white-050 p-6">
        <label htmlFor="motivation" className="block font-semibold text-ink-900">
          Motivaatio
        </label>
        <textarea
          id="motivation"
          name="motivation"
          rows={5}
          value={motivation}
          onChange={(e) => setMotivation(e.target.value)}
          placeholder="Kuvaa lyhyesti, millaiseen työhön tai oppimiseen haluaisit tarttua."
          className="mt-2 w-full rounded-sm border border-white-300 bg-white-050 px-3 py-2 text-ink-900 outline-none transition-colors duration-150 placeholder:text-ink-500 focus-visible:border-orange-500 focus-visible:outline-2 focus-visible:outline-orange-500"
        />
        <p className="mt-2 text-[0.8rem] text-ink-500">Kerro omin sanoin.</p>
      </div>

      <div className="border-t border-white-300 bg-white-050 p-6">
        <p className="max-w-prose text-[0.9rem] leading-relaxed text-orange-600">
          <strong className="font-semibold">HUOM!</strong> Tämä sivu on satiiria eikä VTTU
          kaltaista organisaatiota ole olemassa. Tämän lomakkeen täyttämällä osoitat
          kiinnostuksesi ja tukesi tällaisen toiminnan aloittamiselle.{" "}
          <a
            href="/tietosuojaseloste.txt"
            target="_blank"
            rel="noopener noreferrer"
            className="font-semibold underline decoration-orange-500 underline-offset-2 hover:text-orange-500 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-orange-500"
          >
            Tietosuojaseloste
            <svg
              aria-hidden="true"
              viewBox="0 0 24 24"
              className="ml-0.5 inline-block h-[0.85em] w-[0.85em] align-[0.05em]"
              fill="none"
              stroke="currentColor"
              strokeWidth={2.5}
              strokeLinecap="round"
              strokeLinejoin="round"
            >
              <path d="M7 17 17 7" />
              <path d="M8 7h9v9" />
            </svg>
          </a>
        </p>
        <label htmlFor="acknowledged" className="mt-4 flex items-center gap-2.5 font-semibold text-ink-900">
          <input
            id="acknowledged"
            name="acknowledged"
            type="checkbox"
            required
            checked={acknowledged}
            onChange={(e) => setAcknowledged(e.target.checked)}
            className="h-4 w-4 accent-orange-500 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-orange-500"
          />
          Ymmärretty!
        </label>
      </div>

      {challengeUrl && (
        <div className="border-t border-white-300 bg-white-050 p-6">
          <altcha-widget ref={widgetRef} challenge={challengeUrl} />
        </div>
      )}

      <div className="flex flex-wrap items-center gap-4 border-t border-white-300 bg-white-100 px-6 py-5">
        <button
          type="submit"
          disabled={!acknowledged || submitting || (!!challengeUrl && !altcha)}
          className="rounded-sm bg-orange-500 px-5 py-2 font-semibold text-white-050 transition-transform duration-150 hover:bg-orange-300 active:translate-y-px active:scale-[0.98] active:bg-orange-600 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-orange-500 disabled:cursor-not-allowed disabled:bg-white-300 disabled:text-ink-500 disabled:active:translate-y-0 disabled:active:scale-100 motion-reduce:transition-none"
        >
          {submitting ? "Lähetetään…" : "Lähetä hakemus"}
        </button>
        {status && (
          <p role="status" className="text-[0.9rem] font-semibold text-ink-700">
            {status}
          </p>
        )}
        {error && (
          <p role="alert" className="text-[0.9rem] font-semibold text-orange-600">
            {error}
          </p>
        )}
      </div>
    </form>
  );
}
