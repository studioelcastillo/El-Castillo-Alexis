import axios from "axios";

const RESEND_API_KEY = "re_eVZVv4uU_3f2P1BMDvdw1u8iBMRoHE8pM";
const RESEND_BASE_URL = "https://api.resend.com/emails";
const DEFAULT_FROM = "El Castillo <notificaciones@estudioswebcam.online>";

export default {
  /**
   * Sends an email via Resend API
   * @param {Object} params
   * @param {string} params.to - Recipient email
   * @param {string} params.subject - Email subject
   * @param {string} params.html - Email body in HTML format
   * @param {string} [params.from] - Optional sender email
   */
  async sendEmail({ to, subject, html, from = DEFAULT_FROM }) {
    try {
      const response = await axios.post(
        RESEND_BASE_URL,
        {
          from,
          to,
          subject,
          html,
        },
        {
          headers: {
            Authorization: `Bearer ${RESEND_API_KEY}`,
            "Content-Type": "application/json",
          },
        }
      );

      return {
        data: {
          status: "Success",
          message: "Correo enviado correctamente",
          resend_id: response.data.id,
        },
        error: null,
      };
    } catch (error) {
      console.error(
        "Error sending email via Resend:",
        error.response?.data || error.message
      );
      return {
        data: {
          status: "Error",
          message: error.response?.data?.message || "Error al enviar el correo",
        },
        error: error.response?.data || error,
      };
    }
  },
};
