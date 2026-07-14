export const metadata = {
  title: "Policy - Success Van Hire",
  description: "Privacy, Cookie and related policies for Success Van Hire",
  
  alternates: {
    canonical: "https://www.successvanhire.co.uk/policy",
  },
};

const toc = [
  { id: "privacy-policy", label: "Privacy Policy" },
  { id: "video-surveillance", label: "Video Surveillance" },
  { id: "cookie-policy", label: "Cookie Policy" },
  { id: "cookie-settings", label: "Cookie Settings" },
];

export default function PolicyPage() {
  return (
    <main className="min-h-screen bg-[#0f172b] text-white py-24">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="bg-white/5 border border-white/10 rounded-2xl p-8 md:p-12 mt-10 shadow-xl">
          <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-6 mb-6">
            <div>
              <h1 className="text-3xl md:text-4xl font-extrabold">Policy</h1>
              <p className="text-gray-300 mt-2 max-w-2xl">
                Our policies explain how we handle privacy, cookies and site
                monitoring. Read the sections below for details and controls.
              </p>
            </div>
            <div className="hidden md:flex items-center gap-3">
              <a
                href="#cookie-settings"
                className="text-sm bg-white/6 hover:bg-white/8 px-4 py-2 rounded-md text-[#fe9a00] font-semibold"
              >
                Cookie settings
              </a>
              <a
                href="#cookie-policy"
                className="text-sm bg-white/6 hover:bg-white/8 px-4 py-2 rounded-md text-white font-semibold"
              >
                Cookie policy
              </a>
            </div>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
            <aside className="lg:col-span-3 hidden lg:block">
              <nav className="sticky top-28 bg-transparent p-4 rounded-lg">
                <h4 className="text-sm font-bold text-gray-300 mb-3">
                  On this page
                </h4>
                <ul className="space-y-2">
                  {toc.map((t) => (
                    <li key={t.id}>
                      <a
                        href={`#${t.id}`}
                        className="text-gray-300 hover:text-white text-sm block px-3 py-2 rounded-md hover:bg-white/5"
                      >
                        {t.label}
                      </a>
                    </li>
                  ))}
                </ul>
              </nav>
            </aside>

            <div className="lg:col-span-9 space-y-8">
              <section
                id="privacy-policy"
                className="bg-white/3 p-6 rounded-xl border border-white/5"
              >
                <h2 className="text-2xl font-bold mb-3">PRIVACY POLICY</h2>
                <p className="text-gray-300 leading-relaxed mb-4">
                  This site collects and processes personal information for the
                  purposes described in our privacy policy. We take care to
                  process data only where necessary and with appropriate
                  safeguards. You can contact us for access, rectification or
                  deletion requests.
                </p>
                <div id="video-surveillance" className="mt-4">
                  <h3 className="text-lg font-semibold mb-2">
                    Privacy policy — video surveillance
                  </h3>
                  <p className="text-gray-300 leading-relaxed">
                    We may use video surveillance on our premises for safety and
                    security. Footage is retained in line with applicable laws
                    and is accessed by authorised personnel only. If you have
                    questions about surveillance footage, contact our data
                    protection officer.
                  </p>
                </div>
              </section>

              <section
                id="cookie-policy"
                className="bg-white/3 p-6 rounded-xl border border-white/5"
              >
                <h2 className="text-2xl font-bold mb-3">COOKIE POLICY</h2>
                <p className="text-gray-300 leading-relaxed mb-4">
                  Our website uses cookies and similar technologies. Cookies are
                  small text files that are stored on your device and help us
                  provide and improve services.
                </p>

                <div className="space-y-3">
                  <p
                    id="cookie-settings"
                    className="text-gray-300 leading-relaxed"
                  >
                    We use session cookies for transient preferences (for
                    example language selection) and persistent cookies to
                    remember returning visitors and measure campaign
                    performance. Persistent cookies may remain for up to two
                    years depending on the service.
                  </p>

                  <details className="bg-white/5 p-4 rounded-md border border-white/6">
                    <summary className="cursor-pointer text-white/90 font-semibold">
                      Details — services &amp; third parties
                    </summary>
                    <div className="mt-3 text-gray-300">
                      Further below you will find detailed information about the
                      services we use. Please open each service to learn more
                      about technologies used, data collected, legal basis and
                      retention.
                    </div>
                  </details>
                </div>
              </section>

              <section className="bg-white/3 p-6 rounded-xl border border-white/5">
                <h2 className="text-2xl font-bold mb-3">COOKIE SETTINGS</h2>
                <p className="text-gray-300 leading-relaxed mb-4">
                  You can accept or reject cookies. Use the controls provided on
                  first visit or manage settings via the footer &quot;Cookie
                  settings&quot; link. You may also change browser settings to
                  remove or block cookies.
                </p>
              </section>

              <div className="pt-4 text-gray-400 text-sm">
                <strong className="text-white">Last Updated:</strong> January
                {new Date().getFullYear()} Version 1.0
              </div>
            </div>
          </div>
        </div>
      </div>
    </main>
  );
}
