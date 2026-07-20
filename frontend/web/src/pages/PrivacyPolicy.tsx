import { useNavigate } from "react-router-dom";

export default function PrivacyPolicy() {
  const navigate = useNavigate();

  return (
    <div
      style={{
        minHeight: "100vh",
        backgroundColor: "#f7f9f7",
        padding: "40px 20px",
      }}
    >
      <div
        style={{
          maxWidth: 900,
          margin: "0 auto",
          backgroundColor: "#ffffff",
          padding: "36px",
          borderRadius: 16,
          boxShadow: "0 8px 24px rgba(0, 0, 0, 0.08)",
          color: "#333333",
          lineHeight: 1.7,
        }}
      >
        <button
          type="button"
          onClick={() => navigate("/login")}
          style={{
            border: "none",
            background: "transparent",
            cursor: "pointer",
            fontSize: 14,
            fontWeight: 600,
            marginBottom: 20,
            padding: 0,
          }}
        >
          ← Back
        </button>

        <h1 style={{ marginBottom: 8 }}>Privacy Policy</h1>

        <p style={{ color: "#666666", marginBottom: 28 }}>
          Last updated: July 20, 2026
        </p>

        <section>
          <h2>1. Introduction</h2>
          <p>
            This Privacy Policy explains how ReCopé collects, uses, stores, and
            protects information when users create an account or use the
            application.
          </p>
        </section>

        <section>
          <h2>2. Information We Collect</h2>
          <p>ReCopé may collect information such as:</p>

          <ul>
            <li>Email address and account information</li>
            <li>Username, first name, last name, and profile image</li>
            <li>Pantry ingredients entered by the user</li>
            <li>Recipes created, saved, viewed, or submitted</li>
            <li>Recipe requests and messages sent to AI features</li>
            <li>Consent records and account creation date</li>
            <li>Basic technical and usage information</li>
          </ul>
        </section>

        <section>
          <h2>3. How We Use Information</h2>
          <p>Collected information may be used to:</p>

          <ul>
            <li>Create and manage user accounts</li>
            <li>Provide recipe and pantry features</li>
            <li>Generate personalized or AI-assisted recipe suggestions</li>
            <li>Save user preferences and application activity</li>
            <li>Improve system functionality and security</li>
            <li>Prevent abuse, fraud, and unauthorized access</li>
            <li>Communicate important account or service information</li>
          </ul>
        </section>

        <section>
          <h2>4. AI and Data Processing</h2>
          <p>
            When users use ReCopé’s AI features, information such as pantry
            ingredients, recipe requests, and relevant conversation history may
            be processed to generate a response.
          </p>

          <p>
            Users should not enter passwords, financial information, medical
            records, government identification numbers, or other highly
            sensitive personal information into AI prompts.
          </p>
        </section>

        <section>
          <h2>5. Legal Basis and Consent</h2>
          <p>
            ReCopé processes account and service information as necessary to
            provide the application. Where consent is required, users are asked
            to provide consent during registration or before using a specific
            feature.
          </p>
        </section>

        <section>
          <h2>6. How Information Is Stored</h2>
          <p>
            ReCopé uses third-party hosting, authentication, database, and
            application services to store and process information. Reasonable
            technical and organizational measures are used to protect user
            data.
          </p>

          <p>
            However, no internet-based system can guarantee absolute security.
          </p>
        </section>

        <section>
          <h2>7. Sharing of Information</h2>
          <p>
            ReCopé does not sell personal information. Information may be
            shared only when necessary with service providers that support the
            application, such as authentication, database, hosting, email, or AI
            processing providers.
          </p>

          <p>
            Information may also be disclosed when required by law, regulation,
            legal process, or a valid government request.
          </p>
        </section>

        <section>
          <h2>8. Data Retention</h2>
          <p>
            User information may be retained while an account remains active
            and for a reasonable period afterward when necessary for security,
            recordkeeping, dispute resolution, or legal compliance.
          </p>
        </section>

        <section>
          <h2>9. User Rights</h2>
          <p>
            Depending on applicable law, users may request access to,
            correction of, or deletion of their personal information.
          </p>

          <p>
            Users may also request information about how their data is processed
            or withdraw optional consent. Withdrawing consent does not affect
            processing that occurred before the withdrawal.
          </p>
        </section>

        <section>
          <h2>10. Cookies and Local Storage</h2>
          <p>
            ReCopé may use cookies or browser storage to maintain login
            sessions, remember preferences, and support essential application
            functions.
          </p>
        </section>

        <section>
          <h2>11. Children’s Privacy</h2>
          <p>
            ReCopé is not intended to knowingly collect personal information
            from children below the minimum age required by applicable law
            without appropriate consent from a parent or guardian.
          </p>
        </section>

        <section>
          <h2>12. Changes to This Privacy Policy</h2>
          <p>
            This Privacy Policy may be updated when the application, data
            practices, or legal requirements change. The latest revision date
            will appear at the top of this page.
          </p>
        </section>

        <section>
          <h2>13. Contact</h2>
          <p>
            Privacy-related questions or requests may be directed to the ReCopé
            administrators through the contact information provided in the
            application.
          </p>
        </section>
      </div>
    </div>
  );
}