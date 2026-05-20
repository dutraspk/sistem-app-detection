import type { CapacitorConfig } from "@capacitor/cli";

const config: CapacitorConfig = {
  appId: "com.epiguard.app",
  appName: "EPI Guard",
  webDir: "dist",
  server: {
    androidScheme: "https",
    // Para desenvolvimento ao vivo no celular apontando para o Lovable,
    // descomente e troque pela URL do seu preview/publicação:
    // url: "https://SEU-APP.lovable.app",
    // cleartext: true,
  },
  android: {
    allowMixedContent: true,
  },
};

export default config;
