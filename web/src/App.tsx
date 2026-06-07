import { ApplicationForm } from "./components/ApplicationForm";
import { Eyebrow, Section } from "./components/Section";
import { Wordmark } from "./components/Wordmark";

const principles = [
  {
    title: "Työ jokaiselle",
    body: "Unionin tehtävänä on osoittaa jokaiselle työllistetylle tehtävä, johon hänellä on osaamista tai jonka omaksumiseen hän on valmis. Työsuhde ja palkanmaksu alkavat viivytyksettä, jotta siirtymä työelämään ei jäisi byrokratian varaan."
  },
  {
    title: "Valtiorahoitteinen alku",
    body: "Toiminta rahoitetaan alkuvaiheessa valtion varoin työllistettyjen lukumäärän mukaan. Tavoitteena on rakentaa organisaatio, joka kykenee ajan myötä kantamaan yhä suuremman osan ohjauksestaan omalla henkilöstöllään."
  },
  {
    title: "Tuttu organisaatio",
    body: "Organisaatio rakentuu suuren monialayrityksen tavoin: alakohtaiset johtajat, myynti, projektipäälliköt, tiimit ja toteuttava porras muodostavat selkeän toimintaketjun. Kaikki toimijat ovat unionin omia työntekijöitä."
  },
  {
    title: "Yksilön vapaus",
    body: "Unioni ei edellytä jäseniltään pysyvää sitoutumista. Sen tarkoitus on mahdollistaa oppiminen, työnteko ja yksilön kehitys niin, että työntekijä voi jatkaa eteenpäin heti, kun omat tavoitteet sitä puoltavat."
  }
];

const facts = [
  ["Peruspalkka", "1 000 €/kk + seutukohtainen elinkustannuskorotus"],
  ["Vertailu", "30 % enemmän kuin nykyiset työttömyysetuudet"],
  ["Palkanmaksu", "Alkaa heti työsuhteen alkaessa"],
  ["Pätevyysvaatimus", "Pätevä tai halukas oppimaan"],
  ["Toimipisteet", "Logistisesti järkevät paikat, myös pienemmät kaupungit"]
];

const payRows = [
  ["Pääkaupunkiseutu", "1 000 €", "+ 210 €", "1 210 €"],
  ["Kaupunki", "1 000 €", "+ 60 €", "1 060 €"],
  ["Taajama", "1 000 €", "+ 30 €", "1 030 €"],
  ["Haja-asutusalue", "1 000 €", "+ 10 €", "1 010 €"]
];

export default function App() {
  return (
    <div className="mx-auto my-0 max-w-3xl border-x border-b border-white-300 bg-white-100 sm:my-8">
      {/* Header: the VTTU wordmark and the official name */}
      <header className="border-t border-white-300 px-6 py-10 sm:px-10">
        <Wordmark className="text-[2.441rem] leading-none" />
        <p className="mt-2 text-[1.25rem] font-semibold text-ink-700">
          Valtion Työ- ja Tuotantounioni
        </p>
      </header>

      {/*
        Info box: the flagship yellow field. It deliberately breaks
        aerodynamics (doc/aerodynamics.md). The wrapper spans the full slab
        width and is shoved right by the overflow amount, so the box is indented
        from the slab's left edge by the same ~10% it spills past the right edge
        into the page background.

        The drop shadow must land ONLY on the backmost page background (the
        desk), never on the slab. There is no clean CSS way to clip a shadow to
        "outside the slab", so we use a shadow-only div: a sibling sized to the
        overflow strip, painted under the box (earlier in the DOM, both
        positioned), whose only job is to cast the shadow out onto the desk. The
        opaque yellow box covers the strip itself and the inward shadow; only
        the outward spill, which is over the desk, shows. The exception
        strengthens the rule.
      */}
      <section className="border-t border-white-300 bg-white-100 py-10">
        <div className="relative w-full translate-x-[5%]">
          <div
            aria-hidden="true"
            className="absolute inset-y-0 right-0 w-[5%] rounded-sm shadow-[7px_8px_12px_4px_rgba(26,28,32,0.25)]"
          />
          <div className="relative rounded-sm border border-white-300 bg-yellow-300 px-4 py-3">
            <span className="text-[0.8rem] font-semibold uppercase tracking-[0.04em] text-ink-900">
              Mee VTTU töihin!
            </span>
            <p className="mt-1 text-ink-900">
              Internetissä oletkin saattanut törmätä tähän iloiseen hihkaisuun! Olet ehkä törmännyt
              ihka aitoon VTTU-toimihenkilöön! Me VTTU:lla haluamme, että kaikki menee{" "}
              <strong className="font-semibold">VTTU töihin</strong>!
            </p>
          </div>
        </div>
      </section>

      {/* Esittely */}
      <Section eyebrow="Avoin työ- ja oppimismalli" title="Töihin jo tänään!" surface>
        <p className="max-w-prose leading-relaxed text-ink-900">
          Kuka tahansa voi hakeutua unionin palvelukseen elämäntilanteestaan riippumatta. Ajatus on
          yksinkertainen: jokaiselle osoitetaan työtä osaamisen, potentiaalin ja kiinnostuksen
          perusteella, samalla kun oppiminen ja eteneminen tehdään mahdolliseksi ilman tarpeetonta
          viivettä. Unioni vahvistaa työllisyyttä, toimintakykyä ja koko maan tasapainoista
          kehitystä.
        </p>
      </Section>

      {/* Hakemus: the inert form, moved up right after the intro */}
      <Section eyebrow="Hakemus" title="Hae VTTU töihin!">
        <p className="mb-5 max-w-prose text-ink-900">
          Täytä alla olevat kentät. Riittää kun jätät sähköpostiosoitteesi ja kerrot omin sanoin,
          mikä sinua motivoi.
        </p>
        <ApplicationForm />
      </Section>

      {/* Miten VTTU toimii: cards sharing 1px seams */}
      <Section eyebrow="Toimintaperiaate" title="Miten VTTU toimii" surface>
        <div className="grid gap-px border border-white-300 bg-white-300 sm:grid-cols-2">
          {principles.map((p) => (
            <article key={p.title} className="bg-white-050 p-6">
              <h3 className="text-[1.25rem] font-semibold text-ink-700">{p.title}</h3>
              <p className="mt-2 leading-relaxed text-ink-900">{p.body}</p>
            </article>
          ))}
        </div>
      </Section>

      {/* Lyhyesti: key/value facts */}
      <Section eyebrow="Perustiedot" title="Lyhyesti">
        <dl className="divide-y divide-white-300 border border-white-300">
          {facts.map(([key, val]) => (
            <div key={key} className="grid sm:grid-cols-[16rem_1fr] sm:divide-x sm:divide-white-300">
              <dt className="bg-white-100 px-4 py-3 font-semibold text-ink-700">{key}</dt>
              <dd className="bg-white-050 px-4 py-3 text-ink-900">{val}</dd>
            </div>
          ))}
        </dl>
      </Section>

      {/* Palkkamalli: the table */}
      <Section eyebrow="Kannustinmalli" title="Palkka ja elinkustannusindeksi" surface>
        <div className="overflow-x-auto border border-white-300">
          <table className="w-full border-collapse text-left">
            <thead>
              <tr className="bg-white-100 text-[0.8rem] uppercase tracking-[0.04em] text-ink-700">
                <th className="px-4 py-3 font-semibold">Seutu</th>
                <th className="px-4 py-3 font-semibold">Peruspalkka</th>
                <th className="px-4 py-3 font-semibold">Indeksikorotus</th>
                <th className="px-4 py-3 font-semibold">Yhteensä / kk</th>
              </tr>
            </thead>
            <tbody>
              {payRows.map((row) => (
                <tr key={row[0]} className="border-t border-white-300 even:bg-yellow-100">
                  {row.map((cell, i) => (
                    <td key={i} className={`px-4 py-3 text-ink-900 ${i === 0 ? "font-semibold" : ""}`}>
                      {cell}
                    </td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        <p className="mt-4 max-w-prose text-[0.9rem] leading-relaxed text-ink-500">
          Korotus noudattaa vähenevän hyödyn periaatetta. Malli huomioi elinkustannusten alueelliset
          erot, kannustaa väljempään asumiseen ja avaa pienemmillekin kaupungeille realistisen kasvun
          mahdollisuuden.
        </p>
      </Section>

      {/* Projektit: prose + badges */}
      <Section eyebrow="Työn luonne" title="Kaikki työ on projektilähtöistä">
        <div className="max-w-prose space-y-3 leading-relaxed text-ink-900">
          <p>
            Jos työn luonne ei valmiiksi ole projektilähtöinen, se voidaan jäsentää esimerkiksi
            vuoden mittaisiksi kokonaisuuksiksi, joita johdetaan, hinnoitellaan ja arvioidaan
            projektityön logiikalla.
          </p>
          <p>
            Jos projekti tuottaa voittoa, siitä ohjataan <strong className="font-semibold">20 %</strong>{" "}
            unionin tulevaisuusrahastoon oman toiminnan jatkuvuuden turvaamiseksi. Loppu jaetaan tasan
            projektin jäsenten kesken.
          </p>
          <p>
            Jos projekti ei tuota voittoa, unioni kattaa ylijäämäkulut rahastostaan. Erillisiä
            tulospalkkioita ei makseta, mutta peruspalkanmaksu jatkuu keskeytyksettä. Tämä tekee
            riskistä hallittavan ja kannustaa yrittämään kunnianhimoisesti.
          </p>
        </div>
        <div className="mt-5 flex flex-wrap gap-2">
          <span className="rounded-sm border border-white-300 bg-white-050 px-3 py-1 text-[0.8rem] font-semibold text-ink-700">
            Projektilähtöinen
          </span>
          <span className="rounded-sm border border-white-300 bg-yellow-300 px-3 py-1 text-[0.8rem] font-semibold text-ink-900">
            20 % tulevaisuusrahastoon
          </span>
          <span className="rounded-sm border border-orange-500 px-3 py-1 text-[0.8rem] font-semibold text-orange-600">
            Palkanmaksu käynnissä
          </span>
        </div>
      </Section>

      {/* Toiminta-ajatus: the mission statement */}
      <Section eyebrow="Toiminta-ajatus" title="Työtä koko Suomelle" surface>
        <div className="max-w-prose space-y-3 leading-relaxed text-ink-900">
          <p>
            Valtion Työ- ja Tuotantounioni perustuu ajatukseen, että jokaisella on oikeus
            mielekkääseen työhön elämäntilanteestaan riippumatta. Unioni vastaanottaa hakijan,
            osoittaa hänelle tehtävän ja käynnistää palkanmaksun viivytyksettä. Lähtökohta on
            käytännöllinen: työkyky, oppiminen ja toimeentulo kannattaa sitoa toisiinsa mahdollisimman
            nopeasti ja selkeästi.
          </p>
          <p>
            Toiminta tukee koko maan tasapainoista kehitystä. Toimipisteet sijoitetaan logistisesti
            tarkoituksenmukaisiin paikkoihin siten, että myös pienemmillä paikkakunnilla on
            mahdollisuus kasvaa, vahvistua ja rakentaa kestävää paikallista elinvoimaa.
          </p>
          <p>
            Unioni ei kilpaile työntekijöistä muun työelämän kanssa, vaan toimii sen täydentäjänä.
            Tavoitteena on osaamisen karttuminen, työn arvostus ja yksilön mahdollisuus edetä omaan
            tahtiinsa. Paras lopputulos on, että järjestelmä tekee itsensä tarpeettomammaksi
            synnyttämällä uutta osaamista, liikkuvuutta ja aloitekykyä.
          </p>
        </div>
      </Section>

      {/* Usein kysyttyä */}
      <Section
        eyebrow="Usein kysyttyä"
        title="Entä jos projekti tuottaa jäsenilleen poikkeuksellisen paljon arvoa?"
      >
        <div className="max-w-prose space-y-3 leading-relaxed text-ink-900">
          <p>
            Toisinaan projekti voi onnistua niin hyvin, että sen tekijöille kertyy merkittävä
            varallisuus lyhyessä ajassa. Onko tämä järjestelmän valuvirhe, vai pikemminkin osoitus
            siitä, että malli kykenee synnyttämään todellista arvoa?
          </p>
          <p>
            Ehkä he perustavat oppimillaan tiedoilla uuden yrityksen, siirtyvät muualle työelämään tai
            käynnistävät jotakin täysin omaa.{" "}
            <strong className="font-semibold">Juuri siinä ajatus kirkastuu.</strong> Unioni ei
            edellytä lojaalisuutta, vaan mahdollistaa oppimisen, työnteon ja yksilön itsenäisyyden.
            Dynaaminen yhteiskunta hyötyy siitä, että ihmiset nousevat liikkeelle.
          </p>
        </div>
      </Section>

      {/* Footer */}
      <footer className="border-t border-white-300 bg-white-100 px-6 py-8 sm:px-10">
        <div className="flex items-center gap-3">
          <Wordmark className="text-[1.25rem]" />
          <Eyebrow>x Maxpower, &copy; 2026</Eyebrow>
        </div>
        <p className="mt-3 text-[0.8rem] text-ink-500">Tämä sivu on satiiria ja höpöhöpöä.</p>
      </footer>
    </div>
  );
}
