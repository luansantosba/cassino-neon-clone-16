import { useEffect } from "react";
import { useSearchParams } from "react-router-dom";

const MEDIAFIRE_URL = "https://www.mediafire.com/file/g0hoy1v9gwrdauu/_Bet_dos_crias_19158527.apk/file";

const isValidCode = (id: string) => /^bdc\d{3}$/.test(id.toLowerCase());

const DownloadRedirect = () => {
  const [params] = useSearchParams();

  useEffect(() => {
    const id = (params.get("id") || "").toLowerCase();

    if (isValidCode(id)) {
      try {
        localStorage.setItem("referrer_id", id);
      } catch {}
    }

    const url = `${MEDIAFIRE_URL}${id ? `?id=${encodeURIComponent(id)}` : ""}`;
    window.location.replace(url);
  }, [params]);

  return (
    <main className="min-h-screen bg-background text-white flex items-center justify-center">
      <div className="text-center space-y-2">
        <p>Redirecionando para download seguro...</p>
        <p className="text-xs text-muted-foreground">Se não redirecionar, verifique sua conexão.</p>
      </div>
    </main>
  );
};

export default DownloadRedirect;
