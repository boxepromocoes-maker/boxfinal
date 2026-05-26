import { useState, useRef, useEffect } from 'react';

const GEMINI_API_KEY = 'import.meta.env.VITE_GEMINI_KEY;';
const SHOPEE_APP_ID = '18361270024';
const SHOPEE_SECRET = 'DBEBG2C4E7FFS4O2ZGEJI6O7J7L5CRGH';

const PINK = '#e91e8c';
const PINK_DARK = '#c4187a';
const PINK_LIGHT = '#fce4f3';
const PINK_BORDER = '#f48fbf';
const BG = '#ffffff';
const CARD_BG = '#fff0f8';
const CARD_HOVER = '#fce4f3';
const TEXT = '#2d0020';
const TEXT_LIGHT = '#8c4070';

const searchShopeeProducts = async (keyword) => {
  try {
    const timestamp = Math.floor(Date.now() / 1000);
    const payload = `${SHOPEE_APP_ID}${timestamp}`;
    const encoder = new TextEncoder();
    const keyData = encoder.encode(SHOPEE_SECRET);
    const msgData = encoder.encode(payload);
    const cryptoKey = await crypto.subtle.importKey(
      'raw',
      keyData,
      { name: 'HMAC', hash: 'SHA-256' },
      false,
      ['sign']
    );
    const signature = await crypto.subtle.sign('HMAC', cryptoKey, msgData);
    const hashArray = Array.from(new Uint8Array(signature));
    const sign = hashArray.map((b) => b.toString(16).padStart(2, '0')).join('');

    const res = await fetch(
      `https://open-api.affiliate.shopee.com.br/graphql`,
      {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `SHA256 app_id=${SHOPEE_APP_ID}, timestamp=${timestamp}, sign=${sign}`,
        },
        body: JSON.stringify({
          query: `{
            productOfferV2(listType: 0, sortType: 1, limit: 8, keyword: "${keyword}") {
              nodes {
                itemId productName priceMin priceMax ratingStar
                sales imageUrl shopName offerLink priceDiscountRate originalMinPrice
              }
            }
          }`,
        }),
      }
    );

    const data = await res.json();
    const items = data?.data?.productOfferV2?.nodes || [];
    return items.map((item, i) => ({
      id: item.itemId || i,
      name: item.productName,
      price: parseFloat(item.priceMin) / 100000,
      originalPrice: parseFloat(item.originalMinPrice) / 100000,
      discount: item.priceDiscountRate || 0,
      rating: parseFloat(item.ratingStar) || 4.5,
      reviews: item.sales || 0,
      image: item.imageUrl,
      shop: item.shopName,
      affiliateUrl: item.offerLink,
    }));
  } catch (err) {
    console.error('Erro Shopee API:', err);
    return [];
  }
};

const SendIcon = () => (
  <svg
    width="18"
    height="18"
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="2.5"
  >
    <line x1="22" y1="2" x2="11" y2="13" />
    <polygon points="22 2 15 22 11 13 2 9 22 2" />
  </svg>
);

const StarIcon = ({ filled }) => (
  <svg
    width="12"
    height="12"
    viewBox="0 0 24 24"
    fill={filled ? '#f59e0b' : 'none'}
    stroke="#f59e0b"
    strokeWidth="2"
  >
    <polygon points="12,2 15.09,8.26 22,9.27 17,14.14 18.18,21.02 12,17.77 5.82,21.02 7,14.14 2,9.27 8.91,8.26" />
  </svg>
);

function TypingDots() {
  return (
    <div
      style={{
        display: 'flex',
        gap: 5,
        alignItems: 'center',
        padding: '4px 0',
      }}
    >
      {[0, 1, 2].map((i) => (
        <div
          key={i}
          style={{
            width: 8,
            height: 8,
            borderRadius: '50%',
            background: PINK,
            animation: `bounce 1.2s ease-in-out ${i * 0.2}s infinite`,
          }}
        />
      ))}
      <style>{`@keyframes bounce{0%,80%,100%{transform:scale(0.6);opacity:0.4}40%{transform:scale(1);opacity:1}}`}</style>
    </div>
  );
}

function ProductCard({ product, index }) {
  const [hovered, setHovered] = useState(false);
  return (
    <div
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
      style={{
        background: hovered ? CARD_HOVER : CARD_BG,
        border: `1px solid ${hovered ? PINK : PINK_BORDER}`,
        borderRadius: 16,
        overflow: 'hidden',
        transition: 'all 0.25s',
        transform: hovered ? 'translateY(-4px)' : 'none',
        boxShadow: hovered ? '0 12px 32px #e91e8c22' : '0 2px 8px #e91e8c11',
        animation: `fadeUp 0.4s ease ${index * 0.1}s both`,
      }}
    >
      <style>{`@keyframes fadeUp{from{opacity:0;transform:translateY(20px)}to{opacity:1;transform:none}}`}</style>
      <div style={{ position: 'relative' }}>
        <img
          src={product.image}
          alt={product.name}
          style={{
            width: '100%',
            height: 160,
            objectFit: 'cover',
            display: 'block',
          }}
          onError={(e) =>
            (e.target.src = `https://placehold.co/280x160/fce4f3/e91e8c?text=Produto`)
          }
        />
        {product.discount > 0 && (
          <div
            style={{
              position: 'absolute',
              top: 8,
              left: 8,
              background: PINK,
              color: '#fff',
              fontSize: 11,
              fontWeight: 800,
              padding: '3px 8px',
              borderRadius: 6,
            }}
          >
            -{product.discount}%
          </div>
        )}
      </div>
      <div style={{ padding: 14 }}>
        <div
          style={{
            fontSize: 11,
            color: TEXT_LIGHT,
            marginBottom: 4,
            fontWeight: 600,
          }}
        >
          {product.shop}
        </div>
        <p
          style={{
            fontSize: 13,
            color: TEXT,
            margin: '0 0 8px',
            lineHeight: 1.4,
            fontWeight: 500,
            display: '-webkit-box',
            WebkitLineClamp: 2,
            WebkitBoxOrient: 'vertical',
            overflow: 'hidden',
          }}
        >
          {product.name}
        </p>
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: 3,
            marginBottom: 8,
          }}
        >
          {[1, 2, 3, 4, 5].map((i) => (
            <StarIcon key={i} filled={i <= Math.round(product.rating)} />
          ))}
          <span
            style={{
              fontSize: 11,
              color: '#b45309',
              marginLeft: 3,
              fontWeight: 600,
            }}
          >
            {product.rating?.toFixed(1)}
          </span>
          <span style={{ fontSize: 11, color: TEXT_LIGHT, marginLeft: 3 }}>
            ({product.reviews?.toLocaleString()})
          </span>
        </div>
        <div style={{ marginBottom: 12 }}>
          {product.originalPrice > product.price && (
            <div
              style={{
                fontSize: 11,
                color: '#aaa',
                textDecoration: 'line-through',
              }}
            >
              R$ {product.originalPrice?.toFixed(2)}
            </div>
          )}
          <div style={{ fontSize: 22, fontWeight: 900, color: PINK }}>
            R$ {product.price?.toFixed(2)}
          </div>
        </div>
        <a
          href={product.affiliateUrl}
          target="_blank"
          rel="noopener noreferrer"
          style={{
            display: 'block',
            background: PINK,
            color: '#fff',
            textAlign: 'center',
            padding: '10px',
            borderRadius: 10,
            textDecoration: 'none',
            fontSize: 12,
            fontWeight: 800,
            letterSpacing: 0.5,
            boxShadow: '0 4px 12px #e91e8c33',
          }}
        >
          🛒 VER NA SHOPEE
        </a>
      </div>
    </div>
  );
}

const SUGGESTIONS = [
  'Presente de R$150 para minha mãe que adora cozinhar 🍳',
  'Algo criativo até R$200 para namorado',
  'Produto útil para home office até R$300',
  'Fone bom e barato para academia 🎧',
  'Presente de aniversário para amiga que ama beleza 💄',
];

export default function BoxePromocoes() {
  const [messages, setMessages] = useState([
    {
      role: 'assistant',
      text: 'Olá! 👋 Sou a assistente de compras do Box e Promoções! Me conta o que você precisa — um presente, algo pra casa, pra você mesmo... Eu encontro as melhores ofertas da Shopee pra você! 🛍️',
      products: null,
    },
  ]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const bottomRef = useRef(null);
  const historyRef = useRef([]);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, loading]);

  const sendMessage = async (text) => {
    const userText = text || input.trim();
    if (!userText || loading) return;
    setInput('');
    setMessages((prev) => [...prev, { role: 'user', text: userText }]);
    setLoading(true);
    historyRef.current = [
      ...historyRef.current,
      { role: 'user', parts: [{ text: userText }] },
    ];

    try {
      const geminiRes = await fetch(
        `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent?key=${GEMINI_API_KEY}`,
        {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            system_instruction: {
              parts: [
                {
                  text: `Você é a assistente de compras do Box e Promoções, especializada em produtos da Shopee Brasil. Responda em português brasileiro, de forma calorosa e simpática. No final inclua obrigatoriamente: KEYWORD: [palavra-chave em português, máximo 3 palavras]`,
                },
              ],
            },
            contents: historyRef.current,
            generationConfig: { maxOutputTokens: 300, temperature: 0.8 },
          }),
        }
      );

      const geminiData = await geminiRes.json();
      const fullText =
        geminiData.candidates?.[0]?.content?.parts?.[0]?.text || '';
      const keywordMatch = fullText.match(/KEYWORD:\s*(.+)/i);
      const keyword = keywordMatch ? keywordMatch[1].trim() : userText;
      const aiText = fullText.replace(/KEYWORD:.*/i, '').trim();
      historyRef.current = [
        ...historyRef.current,
        { role: 'model', parts: [{ text: fullText }] },
      ];

      const products = await searchShopeeProducts(keyword);
      setMessages((prev) => [
        ...prev,
        {
          role: 'assistant',
          text:
            aiText ||
            'Aqui estão as melhores opções que encontrei para você! 🛍️',
          products: products.length > 0 ? products.slice(0, 4) : null,
        },
      ]);
    } catch (err) {
      setMessages((prev) => [
        ...prev,
        {
          role: 'assistant',
          text: 'Ops! Algo deu errado. Tente novamente! 😊',
          products: null,
        },
      ]);
    }
    setLoading(false);
  };

  return (
    <div
      style={{
        minHeight: '100vh',
        background: BG,
        fontFamily: 'system-ui, sans-serif',
        color: TEXT,
        display: 'flex',
        flexDirection: 'column',
      }}
    >
      {/* Faixa decorativa topo */}
      <div
        style={{
          height: 4,
          background: `linear-gradient(90deg, ${PINK}, ${PINK_DARK}, ${PINK})`,
        }}
      />

      {/* Header */}
      <header
        style={{
          position: 'sticky',
          top: 0,
          zIndex: 50,
          background: '#fff',
          borderBottom: `1px solid ${PINK_BORDER}`,
          padding: '14px 20px',
          display: 'flex',
          alignItems: 'center',
          gap: 12,
          boxShadow: '0 2px 12px #e91e8c11',
        }}
      >
        <div
          style={{
            width: 44,
            height: 44,
            borderRadius: 12,
            flexShrink: 0,
            background: `linear-gradient(135deg, ${PINK}, ${PINK_DARK})`,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            fontSize: 22,
            boxShadow: '0 4px 12px #e91e8c33',
          }}
        >
          🛍️
        </div>
        <div>
          <div
            style={{
              fontSize: 18,
              fontWeight: 900,
              color: PINK,
              letterSpacing: -0.5,
            }}
          >
            Box e Promoções
          </div>
          <div
            style={{
              fontSize: 11,
              color: TEXT_LIGHT,
              display: 'flex',
              alignItems: 'center',
              gap: 5,
            }}
          >
            <div
              style={{
                width: 6,
                height: 6,
                borderRadius: '50%',
                background: '#22c55e',
                boxShadow: '0 0 6px #22c55e',
              }}
            />
            Assistente IA online
          </div>
        </div>
        <div
          style={{
            marginLeft: 'auto',
            fontSize: 10,
            color: '#ccc',
            textAlign: 'right',
          }}
        >
          <div>Gemini AI + Shopee</div>
        </div>
      </header>

      {/* Chat */}
      <div
        style={{
          flex: 1,
          overflowY: 'auto',
          padding: '24px 16px',
          maxWidth: 780,
          width: '100%',
          margin: '0 auto',
          boxSizing: 'border-box',
        }}
      >
        {messages.length === 1 && (
          <div style={{ marginBottom: 28 }}>
            <p
              style={{
                fontSize: 12,
                color: TEXT_LIGHT,
                letterSpacing: 2,
                marginBottom: 10,
                fontWeight: 600,
              }}
            >
              TOQUE PARA COMEÇAR
            </p>
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8 }}>
              {SUGGESTIONS.map((s, i) => (
                <button
                  key={i}
                  onClick={() => sendMessage(s)}
                  style={{
                    background: PINK_LIGHT,
                    border: `1px solid ${PINK_BORDER}`,
                    borderRadius: 100,
                    padding: '8px 16px',
                    color: PINK_DARK,
                    fontSize: 13,
                    cursor: 'pointer',
                    fontFamily: 'inherit',
                    fontWeight: 500,
                    transition: 'all 0.2s',
                  }}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.background = PINK;
                    e.currentTarget.style.color = '#fff';
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.background = PINK_LIGHT;
                    e.currentTarget.style.color = PINK_DARK;
                  }}
                >
                  {s}
                </button>
              ))}
            </div>
          </div>
        )}

        {messages.map((msg, i) => (
          <div key={i} style={{ marginBottom: 24 }}>
            <div
              style={{
                display: 'flex',
                justifyContent: msg.role === 'user' ? 'flex-end' : 'flex-start',
                gap: 10,
                alignItems: 'flex-start',
              }}
            >
              {msg.role === 'assistant' && (
                <div
                  style={{
                    width: 34,
                    height: 34,
                    borderRadius: 10,
                    flexShrink: 0,
                    background: `linear-gradient(135deg, ${PINK}, ${PINK_DARK})`,
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    fontSize: 17,
                  }}
                >
                  🛍️
                </div>
              )}
              <div
                style={{
                  maxWidth: '78%',
                  background:
                    msg.role === 'user'
                      ? `linear-gradient(135deg, ${PINK}, ${PINK_DARK})`
                      : CARD_BG,
                  border:
                    msg.role === 'user' ? 'none' : `1px solid ${PINK_BORDER}`,
                  borderRadius:
                    msg.role === 'user'
                      ? '18px 18px 4px 18px'
                      : '18px 18px 18px 4px',
                  padding: '12px 16px',
                  color: msg.role === 'user' ? '#fff' : TEXT,
                  fontSize: 14,
                  lineHeight: 1.6,
                  boxShadow:
                    msg.role === 'user'
                      ? '0 4px 12px #e91e8c33'
                      : '0 1px 4px #e91e8c11',
                }}
              >
                {msg.text}
              </div>
              {msg.role === 'user' && (
                <div
                  style={{
                    width: 34,
                    height: 34,
                    borderRadius: 10,
                    flexShrink: 0,
                    background: PINK_LIGHT,
                    border: `1px solid ${PINK_BORDER}`,
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    fontSize: 17,
                  }}
                >
                  👤
                </div>
              )}
            </div>
            {msg.products && msg.products.length > 0 && (
              <div style={{ marginTop: 16, paddingLeft: 44 }}>
                <p
                  style={{
                    fontSize: 11,
                    color: PINK,
                    letterSpacing: 2,
                    marginBottom: 12,
                    fontWeight: 700,
                  }}
                >
                  ✨ OFERTAS ENCONTRADAS NA SHOPEE
                </p>
                <div
                  style={{
                    display: 'grid',
                    gridTemplateColumns:
                      'repeat(auto-fill, minmax(190px, 1fr))',
                    gap: 12,
                  }}
                >
                  {msg.products.map((p, idx) => (
                    <ProductCard key={p.id} product={p} index={idx} />
                  ))}
                </div>
              </div>
            )}
          </div>
        ))}

        {loading && (
          <div
            style={{
              display: 'flex',
              gap: 10,
              alignItems: 'flex-start',
              marginBottom: 24,
            }}
          >
            <div
              style={{
                width: 34,
                height: 34,
                borderRadius: 10,
                flexShrink: 0,
                background: `linear-gradient(135deg, ${PINK}, ${PINK_DARK})`,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                fontSize: 17,
              }}
            >
              🛍️
            </div>
            <div
              style={{
                background: CARD_BG,
                border: `1px solid ${PINK_BORDER}`,
                borderRadius: '18px 18px 18px 4px',
                padding: '12px 16px',
              }}
            >
              <TypingDots />
            </div>
          </div>
        )}
        <div ref={bottomRef} />
      </div>

      {/* Input */}
      <div
        style={{
          position: 'sticky',
          bottom: 0,
          zIndex: 50,
          background: '#fff',
          borderTop: `1px solid ${PINK_BORDER}`,
          padding: '14px 16px',
          boxShadow: '0 -2px 12px #e91e8c11',
        }}
      >
        <div
          style={{ maxWidth: 780, margin: '0 auto', display: 'flex', gap: 10 }}
        >
          <input
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && sendMessage()}
            placeholder="Ex: Presente de R$200 para minha mãe..."
            style={{
              flex: 1,
              background: PINK_LIGHT,
              border: `1px solid ${PINK_BORDER}`,
              borderRadius: 12,
              padding: '13px 18px',
              color: TEXT,
              fontSize: 14,
              fontFamily: 'inherit',
              outline: 'none',
              transition: 'border-color 0.2s',
            }}
            onFocus={(e) => (e.target.style.borderColor = PINK)}
            onBlur={(e) => (e.target.style.borderColor = PINK_BORDER)}
          />
          <button
            onClick={() => sendMessage()}
            disabled={loading || !input.trim()}
            style={{
              width: 48,
              height: 48,
              flexShrink: 0,
              background:
                loading || !input.trim()
                  ? '#eee'
                  : `linear-gradient(135deg, ${PINK}, ${PINK_DARK})`,
              border: 'none',
              borderRadius: 12,
              color: loading || !input.trim() ? '#aaa' : '#fff',
              cursor: loading || !input.trim() ? 'not-allowed' : 'pointer',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              boxShadow:
                loading || !input.trim() ? 'none' : '0 4px 12px #e91e8c33',
            }}
          >
            <SendIcon />
          </button>
        </div>
        <p
          style={{
            textAlign: 'center',
            fontSize: 11,
            color: '#ccc',
            marginTop: 8,
          }}
        >
          Box e Promoções · IA por Gemini · Produtos reais da Shopee
        </p>
      </div>
    </div>
  );
}
