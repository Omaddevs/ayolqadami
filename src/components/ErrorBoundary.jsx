import { Component } from 'react'
import { tr } from '../i18n'


// Ilova ichida xato bo'lsa, bo'sh ekran o'rniga sababini va tiklash tugmasini ko'rsatadi
export default class ErrorBoundary extends Component {
  state = { error: null }

  static getDerivedStateFromError(error) {
    return { error }
  }

  componentDidCatch(error, info) {
    console.error('Ilova xatosi:', error, info?.componentStack)
  }

  reset = () => {
    try { localStorage.removeItem('ayolkaryera_v1') } catch { /* storage mavjud emas */ }
    window.location.assign('/')
  }

  render() {
    if (!this.state.error) return this.props.children
    return (
      <div className="crash">
        <h1>{tr("Nimadir xato ketdi")}</h1>
        <p>{tr("Sahifani yangilab ko'ring. Yordam bermasa, saqlangan ma'lumotlarni tozalab qayta boshlang.")}</p>
        <pre>{String(this.state.error?.message || this.state.error)}</pre>
        <div className="crash-actions">
          <button className="btn btn-soft" onClick={() => window.location.reload()}>{tr("Yangilash")}</button>
          <button className="btn btn-primary" onClick={this.reset}>{tr("Qayta boshlash")}</button>
        </div>
      </div>
    )
  }
}
