
import api from "./api";

const TOKEN_KEY = "auth_token";

const auth = {

    async register(data) {
        const response = await api.post("/register", data);

        const { token, user } = response.data.data;

        if (token) {
            localStorage.setItem(TOKEN_KEY, token);
        }

        return user;
    },

    async login(credentials) {
        const response = await api.post("/login", credentials);

        const { token, user } = response.data.data;

        if (token) {
            localStorage.setItem(TOKEN_KEY, token);
        }

        return user;
    },

    async logout() {
        try {
            // Kirim request logout ketika token masih tersedia
            await api.post("/logout");
        } catch (error) {
            // Abaikan kegagalan request logout.
            // Token lokal tetap akan dihapus.
        } finally {
            // Hapus token setelah request selesai
            localStorage.removeItem(TOKEN_KEY);
        }
    },

    async getUser() {
        const response = await api.get("/me");
        return response.data.data.user;
    },

    getToken() {
        return localStorage.getItem(TOKEN_KEY);
    },

    isAuthenticated() {
        return !!localStorage.getItem(TOKEN_KEY);
    },
};

export default auth;
