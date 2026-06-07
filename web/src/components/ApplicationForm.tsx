import { useState, type FormEvent } from "react";

/**
 * The application form. It is INERT by design: submitting collects nothing and
 * sends nothing. It validates locally, shows an acknowledgement, and resets.
 * The backend Lambda + DynamoDB are deployed and ready to wire up later
 * (see doc/frontend.md "The Lambda is still there").
 */
export function ApplicationForm() {
  const [email, setEmail] = useState("");
  const [motivation, setMotivation] = useState("");
  const [status, setStatus] = useState<string | null>(null);

  function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setStatus("Kiitos! Hakemuksesi on nyt VTTU töissä. (Tämä lomake ei oikeasti lähetä mitään.)");
    setEmail("");
    setMotivation("");
  }

  return (
    <form className="border border-white-300" onSubmit={handleSubmit} noValidate>
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

      <div className="flex flex-wrap items-center gap-4 border-t border-white-300 bg-white-100 px-6 py-5">
        <button
          type="submit"
          className="rounded-sm bg-orange-500 px-5 py-2 font-semibold text-white-050 transition-transform duration-150 hover:bg-orange-300 active:translate-y-px active:scale-[0.98] active:bg-orange-600 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-orange-500 motion-reduce:transition-none"
        >
          Lähetä hakemus
        </button>
        {status && (
          <p role="status" className="text-[0.9rem] font-semibold text-ink-700">
            {status}
          </p>
        )}
      </div>
    </form>
  );
}
