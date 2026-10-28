import { useState } from "react";
/*
 * ⚠️ DRAFT — MUST BE REVIEWED BEFORE THE PILOT. ⚠️
 *
 * This privacy policy was written on 2026-10-27 to match what the code in this repository
 * collects and shows at that date (server/prisma/schema.prisma, server/src/routes/*, src/store.tsx,
 * src/App.tsx, index.html). It is not legal advice and has not been reviewed by a lawyer or by
 * the pilot organization. Before any real neighbor signs up:
 *   - have it reviewed (and re-check it against the code — the app is still changing);
 *   - confirm the hosting providers actually used (the code targets AWS; company docs say NoBucks
 *     will get its own Supabase + Vercel project) and update "Services that help run NoBucks";
 *   - build the things this page promises that the code does not yet do (in-app account deletion,
 *     sign-out, scoping organizer tools to their own community, removing the self-serve
 *     "become a community leader" demo route, photo location-data stripping);
 *   - agree the organizer role, minimum age and retention terms with the host organization.
 * Keep the effective date in sync with real changes.
 */
import { useStore } from "../store";

const EFFECTIVE = "October 29, 2026";
const CONTACT = "hello@somedude.app";

/** Your account: download your data, sign out (here or everywhere), or delete it. */
function AccountPanel() {
  const { state, actions } = useStore();
  const [deleting, setDeleting] = useState(false);
  const [password, setPassword] = useState("");
  if (!state.apiMode || !state.meId) return null;
  return (
    <section className="policy" style={{ paddingBottom: 0 }}>
      <h2 style={{ marginTop: 0 }}>Your account</h2>
      <div style={{ display: "flex", flexWrap: "wrap", gap: 8 }}>
        <button className="btn btn-ghost" onClick={actions.downloadMyData}>Download my data</button>
        <button className="btn btn-ghost" onClick={() => actions.signOut(false)}>Sign out</button>
        <button className="btn btn-ghost" onClick={() => actions.signOut(true)}>Sign out on every device</button>
        <button className="btn btn-ghost" style={{ color: "#b3261e" }} onClick={() => setDeleting(true)}>Delete my account</button>
      </div>
      {deleting && (
        <div className="repcard" style={{ marginTop: 12 }}>
          <div className="repdetails">This deletes your profile, listings, village, events and notifications for good. Messages in
            other people’s trades stay, shown as “Former neighbor”. Finish or cancel any open trade first.</div>
          <div className="field"><label>Type your password to confirm</label>
            <input type="password" value={password} onChange={(e) => setPassword(e.target.value)} /></div>
          <div style={{ display: "flex", gap: 8 }}>
            <button className="btn btn-primary" style={{ background: "#b3261e" }} disabled={!password}
              onClick={async () => { if (await actions.deleteAccount(password)) setDeleting(false); }}>Delete for good</button>
            <button className="btn btn-ghost" onClick={() => { setDeleting(false); setPassword(""); }}>Cancel</button>
          </div>
        </div>
      )}
    </section>
  );
}

export function PrivacyScreen() {
  const { actions } = useStore();

  return (
    <>
      <div className="chat-head">
        <button className="back" aria-label="Back" onClick={actions.closePrivacy}>←</button>
        <div className="ti"><b>🌱 Privacy policy</b><span>How NoBucks handles your info</span></div>
      </div>

      <AccountPanel />
      <article className="policy">
        <p className="lede">
          NoBucks is a neighborhood time bank: you help neighbors, they help you, and sprouts keep
          track of the kindness. No money changes hands. This page explains, in plain words, what we
          keep about you, who can see it, and how to get it deleted.
        </p>
        <p className="eff">Effective {EFFECTIVE}</p>

        <h2>Who we are</h2>
        <p>
          NoBucks is made by SomeDude, an independent studio run by Miguel Morales. When we say “we”
          on this page, we mean SomeDude. NoBucks is starting as a small pilot hosted by a
          neighborhood group or community organization (the “host organization”). You can reach us
          any time at <a href={`mailto:${CONTACT}`}>{CONTACT}</a>.
        </p>

        <h2>What we collect, and why</h2>
        <ul>
          <li><strong>Your account:</strong> your email address, the name you want neighbors to call
            you (a first name or nickname is fine), and your password. We store the password only as a
            scrambled, one-way hash, never as the password itself. We use these to sign you in.</li>
          <li><strong>Your villager and village:</strong> the character look you build, your village
            theme and outfits. This is just for fun, and it’s how neighbors recognize you.</li>
          <li><strong>Verification:</strong> a community leader verifies you in person. We record that
            you’re verified, how (met in person, already known, or vouched for), which leader did it and
            when. We don’t collect ID photos, selfies, phone numbers or addresses for this. If that ever
            changes, we’ll update this page and tell you first.</li>
          <li><strong>What you post:</strong> offers, requests and pacts (title, description, category,
            sprout amount, an optional “where” note, whether you can travel, and an optional photo),
            events you host (title, time, place, size, description), RSVPs, and thank-you notes you
            post to the gratitude wall.</li>
          <li><strong>Messages:</strong> the chats you have with a neighbor to arrange a trade, plus
            short automatic notes like “sprouts reserved” or “trade complete.”</li>
          <li><strong>Sprouts:</strong> your sprout balance and a ledger of every sprout movement
            (welcome grant, reserve, earn, refund, gifts to the community pot). Keeping every movement
            is what lets balances always add up fairly.</li>
          <li><strong>Ratings:</strong> after a completed trade, the stars (and any note) you give and
            receive. We keep your average rating and how many ratings you have.</li>
          <li><strong>Safety tools:</strong> reports you make (who, why, and any details you add) and
            the people you block.</li>
          <li><strong>Your village keepsakes:</strong> neighbors you’ve traded with join your village
            automatically. You can also add “off-app” villagers, people who help you but aren’t on
            NoBucks, with a name and a note. Please keep those notes kind and simple; they’re about
            real people.</li>
          <li><strong>Notifications:</strong> the in-app notifications we send you, and, if you turn
            on push notifications on a device, that device’s push token so we can reach it.</li>
          <li><strong>Your neighborhood:</strong> the name of the neighborhood you belong to (like
            “Echo Park”), so you see the right community.</li>
        </ul>
        <p>
          Some playful features (stickers, circles, village trading cards and giving goals) currently
          live only in the app on your device for that visit and aren’t saved on our servers.
        </p>

        <h2>Your location</h2>
        <ul>
          <li>NoBucks <strong>doesn’t ask for your street address</strong> and doesn’t send your
            device’s GPS location to our servers.</li>
          <li>To show the real weather in your village, the app may ask your browser for your location.
            If you say yes, your device sends those coordinates straight to the free weather service
            Open-Meteo to look up the forecast; they don’t come to us. If you say no, your village just
            shows clear skies.</li>
          <li>The “where” on a post or event is whatever you type, and other members can read it. Use a
            public spot or a general area (“the park,” “near the library”) rather than your home address
            until you’ve arranged things with someone you trust.</li>
          <li>Photos from phones can carry hidden location data. NoBucks redraws every photo on your
            device before it’s uploaded, which removes that data (and the camera details). Photos are
            stored privately and open through links that expire after an hour.</li>
          <li>Distances on posts are rounded to the nearest half mile, worked out from a rough area
            (about a kilometer across), so they can’t be used to find someone’s home.</li>
        </ul>

        <h2>Who can see what</h2>
        <table>
          <thead><tr><th>Info</th><th>Who can see it</th></tr></thead>
          <tbody>
            <tr><td>Your name, villager look, posts (including photos and “where” notes), events you host, average rating and number of ratings, verified badge</td><td>Other signed-in NoBucks members</td></tr>
            <tr><td>Thank-you notes on the gratitude wall (your name, who you thanked, your words)</td><td>Other signed-in NoBucks members</td></tr>
            <tr><td>How many people RSVP’d to an event</td><td>Other signed-in members (not who RSVP’d)</td></tr>
            <tr><td>Your chats</td><td>Only you and the neighbor you’re chatting with</td></tr>
            <tr><td>Your email, sprout balance and sprout history, your village, who you blocked, your notifications</td><td>Only you</td></tr>
            <tr><td>The note in a rating, and who left which stars</td><td>Not shown in the app; it only feeds the average</td></tr>
            <tr><td>Reports you make</td><td>Community organizers (see below). The person you report isn’t told it was you.</td></tr>
          </tbody>
        </table>
        <p>
          The neighbor you trade with will also see, in your chat, that sprouts were reserved and the
          trade was completed. “Other signed-in members” currently means everyone with a NoBucks
          account, not only people in your neighborhood. Posts aren’t shown to people who aren’t
          signed in. One caveat: a photo you post
          is stored at a web link, and anyone who gets that link may be able to open it, so don’t put
          private information in photos.
        </p>

        <h2>Community organizers and the host organization</h2>
        <p>
          During the pilot, a few people from the host organization may be given an organizer role to
          keep the community safe and healthy. With the community tools, organizers can see:
        </p>
        <ul>
          <li>totals for the community: how many members, posts and events there are, and the size of
            the shared community pot;</li>
          <li>open reports, including the name of the person who reported, the name of the person
            reported, the reason and any details, so they can review them and take action.</li>
        </ul>
        <p>
          Organizers <strong>can’t</strong> read your chats, see your email or password, or see your
          personal sprout balance or history through NoBucks. The host organization doesn’t get a copy
          of the NoBucks database. If that ever needs to change (for example, a report that involves
          someone’s safety), we’ll say so here first.
        </p>
        <p>
          We (SomeDude) can technically access the database that runs NoBucks. We only look at your
          information when we need to: to keep the service running, fix problems, help you when you
          ask, investigate a serious safety report, or when the law requires it.
        </p>

        <h2>Services that help run NoBucks</h2>
        <p>We use a few outside services. They handle data only to provide their service to us:</p>
        <ul>
          <li><strong>Hosting and storage:</strong> NoBucks is built to run on Amazon Web Services:
            a database for accounts, posts, messages and sprouts, and file storage for photos.</li>
          <li><strong>Push notifications:</strong> if you turn them on, a short message (for example,
            “New message from Sam” plus the message text) is passed through Amazon’s notification
            service and your phone or browser maker’s push service (like Apple or Google) to reach you.</li>
          <li><strong>Fonts:</strong> the app loads its fonts from Google Fonts, which means Google sees
            your device’s IP address when the page loads.</li>
          <li><strong>Weather:</strong> Open-Meteo, only if you allow location (see above).</li>
        </ul>
        <p>
          We don’t use analytics or tracking tools, advertising networks, or AI services in NoBucks.
          Signing in with Google, Apple or Facebook isn’t turned on yet; if we add it, we’ll update
          this page.
        </p>

        <h2>Cookies and your device</h2>
        <p>
          NoBucks doesn’t use tracking cookies. When you sign in, the app saves a sign-in token in your
          browser’s storage so you stay signed in. It lasts up to 30 days. If you share a device,
          clear this site’s data in your browser when you’re done.
        </p>

        <div className="never">
          <h2 style={{ marginTop: 4 }}>Things we never do</h2>
          <ul>
            <li>We never sell your information or share it with data brokers.</li>
            <li>We never show ads or let advertisers target you.</li>
            <li>We never take a cut of trades or charge fees for helping each other. Sprouts aren’t
              money, and no one can buy them.</li>
            <li>We never track you across other websites or apps.</li>
          </ul>
        </div>

        <h2>How long we keep things</h2>
        <p>
          We keep your information while your account is open, so your chats, posts, village and sprout
          history are there when you come back. When you delete your account, we delete your profile,
          posts, messages, village, notifications and devices. A few things may be kept without your
          name attached, such as sprout ledger entries, so the community pot and other neighbors’
          balances still add up. A neighbor’s own copy of a past chat, or a report about a serious
          safety problem, may be kept as long as it’s needed for that purpose.
        </p>

        <h2>Deleting your account and your data</h2>
        <p>
          You can delete your account at any time in the app (Your account &amp; privacy → Delete my
          account), and download a copy of everything we hold about you there too. Deleting removes your
          profile, posts, village, events and notifications; messages in other people’s trades stay, shown
          as “Former neighbor”. If you can’t use the app, email{" "}
          <a href={`mailto:${CONTACT}`}>{CONTACT}</a> from the address you signed up with, and we’ll do it
          for you. You can also ask us to fix something that’s wrong. Depending on where you live (for example,
          California), you may have more privacy rights; just ask, and we’ll help.
        </p>

        <h2>Keeping it safe</h2>
        <p>
          Passwords are stored only as one-way hashes, and the app talks to our servers over encrypted
          connections. Only the two people in a chat can open it through the app. No system is
          perfect, so please use a password you don’t use anywhere else. If something goes wrong that
          affects your information, we’ll tell you.
        </p>

        <h2>Kids</h2>
        <p>
          NoBucks is for adults: you must be 18 or older to join, because neighbors meet in person to
          trade help. If you think someone under 18 has joined, email us and we’ll close the account.
        </p>

        <h2>Changes to this policy</h2>
        <p>
          NoBucks is still growing, and this page will change with it. If we make a meaningful change,
          we’ll tell you in the app before it takes effect and update the date at the top.
        </p>

        <h2>Questions?</h2>
        <p>
          Email <a href={`mailto:${CONTACT}`}>{CONTACT}</a>. A real person reads it.
        </p>

        <p className="sign">NoBucks is made by SomeDude, an independent studio run by Miguel Morales. 🌱</p>
        <button className="btn btn-ghost" onClick={actions.closePrivacy}>← Back to NoBucks</button>
      </article>
    </>
  );
}
