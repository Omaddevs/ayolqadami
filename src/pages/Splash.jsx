// Turli kasbdagi ishchi ayollar (demo rasmlar — Unsplash). O'z rasmlaringiz bilan almashtiring.
const WOMEN = [
  { id: '1559839734-2b71ea197ec2', job: 'Shifokor' },
  { id: '1758685847747-597ce085906e', job: "O'qituvchi" },
  { id: '1581091224003-01e7c2e69f6f', job: 'Muhandis' },
  { id: '1556911073-52527ac43761', job: 'Oshpaz' },
  { id: '1573164713791-0dfcd2a183a7', job: 'Dasturchi' },
  { id: '1787505136265-9a99dad3bbac', job: 'Tikuvchi' },
  { id: '1594824476967-48c8b964273f', job: 'Hamshira' },
  { id: '1775486766702-4463e7998060', job: 'Uchuvchi' },
  { id: '1758518729466-827cd8293992', job: 'Tadbirkor' },
  { id: '1761839257144-297ce252742e', job: 'Fermer' },
  { id: '1582719471384-894fbb16e074', job: 'Olima' },
  { id: '1611432579402-7037e3e2c1e4', job: 'Menejer' },
]
// Rasm o'lchamlari (konteyner kengligiga nisbatan %) — referensdagidek turlicha
const SIZES = [17, 12, 14.5, 11, 16, 12.5, 15, 11, 17, 12, 14, 12.5]

const src = (id) => `https://images.unsplash.com/photo-${id}?w=180&h=180&fit=crop&crop=faces&q=80`

export default function Splash({ onStart }) {
  return (
    <div className="spl">
      <div className="spl-ring-wrap">
        <div className="spl-disc d1" />
        <div className="spl-disc d2" />
        <div className="spl-ring">
          {WOMEN.map((w, k) => (
            <div key={w.id} className="spl-item" style={{ '--a': `${(360 / WOMEN.length) * k}deg`, '--s': `${SIZES[k]}cqw` }}>
              <img src={src(w.id)} alt={w.job} title={w.job} draggable="false" />
            </div>
          ))}
        </div>
        <div className="spl-logo"><img src="/logo.png" alt="AyolQadami" /></div>
      </div>

      <div className="spl-text">
        <h1>AyolQadami</h1>
        <p>Har bir ayol uchun munosib ish va karyera</p>
      </div>
      <button className="spl-btn" onClick={onStart}>Boshlash</button>
    </div>
  )
}
