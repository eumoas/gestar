import React, { useState } from 'react';
import { MapContainer, TileLayer, Marker, Popup } from 'react-leaflet';
import L from 'leaflet';
import markerIcon2x from 'leaflet/dist/images/marker-icon-2x.png';
import markerIcon from 'leaflet/dist/images/marker-icon.png';
import markerShadow from 'leaflet/dist/images/marker-shadow.png';
import 'leaflet/dist/leaflet.css';
import { MapPin, Phone, ExternalLink, HeartHandshake } from 'lucide-react';
import { api } from '../api';
import { useGestanteContext } from '../context/GestanteContext';
import { Card } from '../components/ui/Card';
import { Button } from '../components/ui/Button';

// Correção conhecida: bundlers (Vite/webpack) não resolvem os ícones padrão do
// Leaflet sozinhos — precisamos apontar explicitamente para os arquivos.
L.Icon.Default.mergeOptions({
  iconRetinaUrl: markerIcon2x,
  iconUrl: markerIcon,
  shadowUrl: markerShadow,
});

const TIPO_LABEL = {
  banco: 'Banco de leite',
  posto_coleta: 'Posto de coleta',
  centro_referencia: 'Centro de referência',
};

const inputStyle = {
  padding: '10px 12px',
  borderRadius: 'var(--radius-card-sm)',
  border: '1px solid var(--border)',
  fontFamily: 'var(--font-sans)',
  fontSize: 'var(--text-body)',
  color: 'var(--text)',
};

export default function Amamentacao() {
  const { selected, loading } = useGestanteContext();
  const [enviandoRegistro, setEnviandoRegistro] = useState(false);
  const [mensagemRegistro, setMensagemRegistro] = useState(null);

  const [uf, setUf] = useState('');
  const [municipio, setMunicipio] = useState('');
  const [unidades, setUnidades] = useState(null);
  const [geocodificado, setGeocodificado] = useState(false);
  const [buscando, setBuscando] = useState(false);
  const [erroLocalizacao, setErroLocalizacao] = useState(null);

  const buscarPorCoordenadas = () => {
    setErroLocalizacao(null);
    if (!navigator.geolocation) {
      setErroLocalizacao('Seu navegador não suporta geolocalização. Busque por UF/município abaixo.');
      return;
    }
    setBuscando(true);
    navigator.geolocation.getCurrentPosition(
      async (pos) => {
        const resp = await api.buscarUnidadesBLH({ lat: pos.coords.latitude, lng: pos.coords.longitude });
        setUnidades(resp.unidades);
        setGeocodificado(resp.geocodificado);
        setBuscando(false);
      },
      () => {
        setErroLocalizacao('Não foi possível usar sua localização. Busque por UF/município abaixo.');
        setBuscando(false);
      },
      { timeout: 8000 }
    );
  };

  const buscarPorMunicipio = async () => {
    setBuscando(true);
    setErroLocalizacao(null);
    const resp = await api.buscarUnidadesBLH({ uf: uf || undefined, municipio: municipio || undefined });
    setUnidades(resp.unidades);
    setGeocodificado(resp.geocodificado);
    setBuscando(false);
  };

  const enviarRegistro = async (tipo) => {
    if (!selected) return;
    setEnviandoRegistro(true);
    try {
      const resp = await api.registrarAmamentacao(selected.id, tipo);
      setMensagemRegistro(resp.alerta || 'Registro salvo.');
    } finally {
      setEnviandoRegistro(false);
    }
  };

  if (loading) return <p className="muted">Carregando...</p>;
  if (!selected) return <p className="muted">Cadastre uma gestante primeiro.</p>;

  const unidadesComCoord = (unidades || []).filter((u) => u.latitude != null);
  const mostrarMapa = geocodificado && unidadesComCoord.length > 0;

  return (
    <div className="stack">
      <div>
        <h2 style={{ fontSize: 'var(--text-title)' }}>Amamentação</h2>
        <p className="muted">Orientações, registro de dificuldades e bancos de leite humano perto de você</p>
      </div>

      <Card>
        <p className="section-title">Orientações de ordenha</p>
        <ul style={{ paddingLeft: 18, margin: 0, display: 'flex', flexDirection: 'column', gap: 6, fontSize: 'var(--text-body)' }}>
          <li>Lave bem as mãos antes de manusear as mamas ou os utensílios.</li>
          <li>Massageie suavemente a mama antes de iniciar a ordenha.</li>
          <li>Ordenhe em ambiente tranquilo, de preferência pensando no bebê.</li>
          <li>Guarde o leite em recipiente limpo, identificado com data e hora.</li>
          <li>Em caso de dor, rachaduras ou pouca produção, procure orientação — não é normal sofrer.</li>
        </ul>
      </Card>

      <Card>
        <p className="section-title">Registrar hoje</p>
        <div style={{ display: 'flex', gap: 'var(--space-2)', flexWrap: 'wrap' }}>
          <Button variant="outline" disabled={enviandoRegistro} onClick={() => enviarRegistro('dificuldade')}>
            Registrar dificuldade
          </Button>
          <Button variant="outline" disabled={enviandoRegistro} onClick={() => enviarRegistro('ordenha')}>
            Registrar ordenha
          </Button>
        </div>
        {mensagemRegistro && <p className="hint" style={{ marginTop: 'var(--space-2)' }}>{mensagemRegistro}</p>}
      </Card>

      <Card>
        <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-2)', marginBottom: 'var(--space-2)' }}>
          <HeartHandshake size={18} strokeWidth={2} aria-hidden="true" />
          <span className="section-title" style={{ marginBottom: 0 }}>Tem leite excedente?</span>
        </div>
        <p style={{ marginBottom: 'var(--space-3)' }}>
          A doação de leite humano ajuda recém-nascidos internados que dependem de prescrição médica para
          recebê-lo. Registre sua intenção e procure o banco de leite mais próximo.
        </p>
        <Button variant="outline" disabled={enviandoRegistro} onClick={() => enviarRegistro('doacao')}>
          Registrar intenção de doação
        </Button>
      </Card>

      <div>
        <p className="section-title">Encontrar banco de leite humano</p>
        <Card>
          <Button style={{ width: '100%' }} disabled={buscando} onClick={buscarPorCoordenadas}>
            <MapPin size={16} style={{ marginRight: 6, verticalAlign: -3 }} />
            {buscando ? 'Buscando…' : 'Usar minha localização'}
          </Button>
          {erroLocalizacao && <p className="hint" style={{ marginTop: 'var(--space-2)' }}>{erroLocalizacao}</p>}

          <div style={{ display: 'flex', gap: 'var(--space-2)', marginTop: 'var(--space-3)' }}>
            <input
              placeholder="UF"
              value={uf}
              onChange={(e) => setUf(e.target.value.toUpperCase())}
              maxLength={2}
              style={{ ...inputStyle, width: 64 }}
            />
            <input
              placeholder="Município"
              value={municipio}
              onChange={(e) => setMunicipio(e.target.value)}
              style={{ ...inputStyle, flex: 1 }}
            />
            <Button variant="outline" disabled={buscando} onClick={buscarPorMunicipio}>Buscar</Button>
          </div>

          <p className="hint" style={{ marginTop: 'var(--space-3)' }}>
            Em caso de dúvida, ligue para o Disque Saúde <a href="tel:136">136</a>.
          </p>
        </Card>

        {unidades && (
          <div className="stack" style={{ marginTop: 'var(--space-3)' }}>
            {mostrarMapa ? (
              <div style={{ height: 280, borderRadius: 'var(--radius-card)', overflow: 'hidden' }}>
                <MapContainer
                  center={[unidadesComCoord[0].latitude, unidadesComCoord[0].longitude]}
                  zoom={11}
                  style={{ height: '100%', width: '100%' }}
                >
                  <TileLayer
                    url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
                    attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
                  />
                  {unidadesComCoord.map((u) => (
                    <Marker key={u.id} position={[u.latitude, u.longitude]}>
                      <Popup>
                        <strong>{u.nome}</strong>
                        <br />
                        {u.telefone && <a href={`tel:${u.telefone}`}>{u.telefone}</a>}
                      </Popup>
                    </Marker>
                  ))}
                </MapContainer>
              </div>
            ) : (
              <p className="hint">Mapa com pinos em breve — mostrando lista por enquanto.</p>
            )}

            {unidades.length === 0 && <p className="hint">Nenhuma unidade encontrada para esse filtro.</p>}
            {unidades.map((u) => (
              <Card key={u.id}>
                <span className="hint" style={{ fontWeight: 600 }}>{TIPO_LABEL[u.tipo] || u.tipo}</span>
                <p style={{ fontWeight: 600, marginTop: 4, marginBottom: 2 }}>{u.nome}</p>
                <p className="hint">
                  {u.endereco}, {u.municipio}/{u.uf}
                  {u.distancia_km != null ? ` · ${u.distancia_km} km` : ''}
                </p>
                <div style={{ display: 'flex', gap: 'var(--space-3)', marginTop: 'var(--space-2)', flexWrap: 'wrap' }}>
                  {u.telefone && (
                    <a href={`tel:${u.telefone}`} style={{ fontSize: 'var(--text-secondary)', color: 'var(--primary)', fontWeight: 600, textDecoration: 'none' }}>
                      <Phone size={14} style={{ verticalAlign: -2, marginRight: 4 }} />{u.telefone}
                    </a>
                  )}
                  <a href={u.url} target="_blank" rel="noreferrer" style={{ fontSize: 'var(--text-secondary)', color: 'var(--primary)', fontWeight: 600, textDecoration: 'none' }}>
                    <ExternalLink size={14} style={{ verticalAlign: -2, marginRight: 4 }} />Página oficial
                  </a>
                </div>
              </Card>
            ))}
            {unidades.length > 0 && (
              <p className="hint" style={{ fontStyle: 'italic' }}>
                Confirme por telefone antes de se deslocar — o cadastro pode estar desatualizado.
              </p>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
