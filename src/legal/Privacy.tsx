import { LegalPage } from "./LegalPage";

// /privacy page text. Keep it word for word as approved; change it only with a new effective date.
export function Privacy() {
  return (
    <LegalPage title="Privacy Policy">
      <h2>The short version</h2>
      <p>We collect the information you give us when you ask about our services or book a call. We use it to reply to you and to run our advertising. We use the Meta Pixel to measure our ads. We don't sell your personal information.</p>

      <h2>Who we are</h2>
      <p>Ossmark Media ("Ossmark," "we," "us") runs advertising for home service businesses. This policy covers ossmark.media and the pages on it, including our booking pages.</p>

      <h2>What we collect</h2>
      <p>What you tell us. When you fill out our qualifier form or book a call, we collect your name, business name, email address, phone number, trade, monthly ad budget range, and your goal. If you book a call, we also collect the time you choose and any answers you give on the booking form.</p>
      <p>What we collect automatically. When you visit the site we collect your IP address, browser and device type, the pages you view, the website you came from, and campaign details in the link you clicked (for example, UTM tags and Meta's click ID). We collect this through cookies and similar technology.</p>

      <h2>How we use it</h2>
      <ul>
        <li>To reply to your request and run the call you booked</li>
        <li>To decide whether we're a good fit to work together</li>
        <li>To measure and improve our ads and website</li>
        <li>To keep the site secure and prevent spam</li>
        <li>To follow the law</li>
      </ul>

      <h2>Advertising and the Meta Pixel</h2>
      <p>We use the Meta Pixel, a tool from Meta Platforms, Inc. It records events on our site, such as viewing a page, submitting the qualifier form, and booking a call, and sends them to Meta along with browser information such as cookie identifiers. We use this to measure our ads and to show our ads to people who may be interested. Meta handles that data under its own policies at facebook.com/privacy/policy.</p>
      <p>You can limit this by changing your ad settings in your Facebook and Instagram accounts, by blocking cookies in your browser, or by using a browser setting or extension that blocks trackers. We send Meta the event along with general answers such as your trade and ad budget range. We never send your name, business name, email address, or phone number.</p>

      <h2>Who we share it with</h2>
      <p>We share information only with the services we use to run the business:</p>
      <ul>
        <li>Hosting: Vercel</li>
        <li>Booking: Cal.com</li>
        <li>Customer records: Notion</li>
        <li>Internal alerts: Slack</li>
        <li>Advertising measurement: Meta</li>
        <li>Video calls: Zoom</li>
      </ul>
      <p>They process data for us under their own terms. We don't sell your personal information, and we don't share it for others' marketing. We may disclose information if the law requires it or to protect our rights.</p>

      <h2>How long we keep it</h2>
      <p>We keep information from people who don't become clients for up to 24 months, then delete it. We keep client records for as long as we work together and as long after that as the law or our records require.</p>

      <h2>Your choices</h2>
      <ul>
        <li>Email us at donoven@ossmark.media to ask what we have about you, to correct it, or to delete it. We'll reply within 30 days.</li>
        <li>Marketing emails: every one includes an unsubscribe link, or you can email us.</li>
        <li>California and other state residents: you may have additional rights to know, delete, and correct your information, and to opt out of the sale or sharing of it. We don't sell personal information. Use the email above to make a request.</li>
      </ul>

      <h2>Security</h2>
      <p>We use reputable services and limit who can see your information. No system is perfectly secure, so we can't guarantee absolute security.</p>

      <h2>Children</h2>
      <p>Our site is for business owners. It isn't meant for anyone under 18, and we don't knowingly collect their information.</p>

      <h2>Changes</h2>
      <p>If we change this policy, we'll post the new version here and update the date at the top.</p>

      <h2>Contact</h2>
      <address>
        Ossmark Media<br />
        5051 Black Horse Pike, Unit 4 #1333<br />
        Turnersville, NJ 08012<br />
        donoven@ossmark.media
      </address>
    </LegalPage>
  );
}
