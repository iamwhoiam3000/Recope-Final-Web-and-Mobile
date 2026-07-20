import { useNavigate } from "react-router-dom";

export default function TermsAndConditions() {
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

        <h1 style={{ marginBottom: 8 }}>Terms and Conditions</h1>

        <p style={{ color: "#666666", marginBottom: 28 }}>
          Last updated: July 20, 2026
        </p>

        <section>
          <h2>1. Acceptance of the Terms</h2>
          <p>
            By creating an account or using ReCopé, you confirm that you have
            read, understood, and agreed to these Terms and Conditions.
          </p>
        </section>

        <section>
          <h2>2. About ReCopé</h2>
          <p>
            ReCopé is a recipe management and recommendation platform that may
            provide recipe suggestions based on ingredients, preferences, and
            information entered by users.
          </p>
        </section>

        <section>
          <h2>3. User Accounts</h2>
          <p>
            You are responsible for providing accurate registration
            information, protecting your account credentials, and notifying the
            ReCopé administrators if you believe your account has been accessed
            without permission.
          </p>
        </section>

        <section>
          <h2>4. Acceptable Use</h2>
          <p>
            You agree not to use ReCopé for unlawful, harmful, fraudulent, or
            abusive activities. You must not attempt to interfere with the
            system, access another user’s account, or upload malicious content.
          </p>
        </section>

        <section>
          <h2>5. User-Submitted Content</h2>
          <p>
            You are responsible for recipes, ingredients, images, comments, and
            other content you submit. You must only upload content that you own
            or are authorized to use.
          </p>
        </section>

        <section>
          <h2>6. AI-Generated Content</h2>
          <p>
            ReCopé may use artificial intelligence to generate recipes,
            suggestions, descriptions, or other content. AI-generated results
            may be inaccurate, incomplete, or unsuitable for a particular user.
          </p>

          <p>
            Users should review generated recipes before following them and
            confirm that the ingredients, preparation steps, temperatures, and
            cooking times are safe and appropriate.
          </p>
        </section>

        <section>
          <h2>7. Allergies and Health Information</h2>
          <p>
            ReCopé does not provide medical, nutritional, or professional
            healthcare advice. Users are responsible for checking ingredients
            for allergies, dietary restrictions, medication interactions, and
            other health concerns.
          </p>

          <p>
            Seek advice from a qualified healthcare professional when necessary.
          </p>
        </section>

        <section>
          <h2>8. Availability of the Service</h2>
          <p>
            ReCopé may be updated, suspended, changed, or temporarily
            unavailable because of maintenance, technical problems, security
            concerns, or other operational reasons.
          </p>
        </section>

        <section>
          <h2>9. Limitation of Liability</h2>
          <p>
            To the extent permitted by applicable law, ReCopé and its
            administrators are not responsible for losses, injuries, allergic
            reactions, food-related illness, or damages resulting from reliance
            on user-submitted or AI-generated content.
          </p>
        </section>

        <section>
          <h2>10. Account Suspension or Termination</h2>
          <p>
            Accounts may be restricted or removed when users violate these
            terms, misuse the service, threaten system security, or engage in
            unlawful activities.
          </p>
        </section>

        <section>
          <h2>11. Changes to These Terms</h2>
          <p>
            These Terms and Conditions may be updated when the service,
            applicable requirements, or system practices change. The updated
            date will appear at the top of this page.
          </p>
        </section>

        <section>
          <h2>12. Contact</h2>
          <p>
            Questions regarding these Terms and Conditions may be directed to
            the ReCopé administrators through the contact information provided
            in the application.
          </p>
        </section>
      </div>
    </div>
  );
}