import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom'; // Import useNavigate
import './AdicionarColaborador.css';

export default function AdicionarColaborador() {
  const navigate = useNavigate(); // Initialize useNavigate
  const [formData, setFormData] = useState({
    nome: '',
    email: '',
    telefone: '',
    departamento: '',
    cargo: '',
    especialidade: '',
    ativo: true,
  });

  const [searchTerm, setSearchTerm] = useState('');
  const [selectedColaborador, setSelectedColaborador] = useState(null);
  const [colaboradores, setColaboradores] = useState([]);
  const [activeTab, setActiveTab] = useState('todos'); // Corrigir valor inicial
  const [error, setError] = useState('');

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleAddColaborador = () => {
    if (!formData.nome || !formData.email) {
      setError('Nome e email são obrigatórios');
      return;
    }

    const novoColaborador = {
      id: Date.now(),
      ...formData,
    };

    setColaboradores(prev => [novoColaborador, ...prev]);
    setSelectedColaborador(novoColaborador);
    setFormData({
      nome: '',
      email: '',
      telefone: '',
      departamento: '',
      cargo: '',
      especialidade: '',
      ativo: true,
    });
    setError('');

    navigate('/colaboradores'); // Change this path to the correct one
  };

  const handleSelectColaborador = (colaborador) => {
    setSelectedColaborador(colaborador);
    setFormData(colaborador);
  };

  const filteredColaboradores = colaboradores
    .filter(c =>
      c.nome.toLowerCase().includes(searchTerm.toLowerCase()) ||
      c.email.toLowerCase().includes(searchTerm.toLowerCase())
    )
    .filter(c => {
      if (activeTab === 'ativos') return c.ativo;
      return true;
    });

  return (
    <div className="acol-container">
      <div className="acol-page">
        {/* Left Column */}
        <div className="acol-left">
          {/* Dados Pessoais */}
          <div className="acol-card">
            <div className="acol-card-title">Dados Pessoais</div>

            <div className="acol-field">
              <label className="acol-label">Nome Completo</label>
              <input
                type="text"
                name="nome"
                value={formData.nome}
                onChange={handleInputChange}
                className="acol-select"
                placeholder="Insira o nome completo"
              />
            </div>

            <div className="acol-field">
              <label className="acol-label">Email</label>
              <input
                type="email"
                name="email"
                value={formData.email}
                onChange={handleInputChange}
                className="acol-select"
                placeholder="email@exemplo.com"
              />
            </div>

            <div className="acol-field">
              <label className="acol-label">Telefone</label>
              <input
                type="tel"
                name="telefone"
                value={formData.telefone}
                onChange={handleInputChange}
                className="acol-select"
                placeholder="(00) 00000-0000"
              />
            </div>
          </div>

          {/* Informações Profissionais */}
          <div className="acol-card">
            <div className="acol-card-title">Informações Profissionais</div>

            <div className="acol-field">
              <label className="acol-label">Departamento</label>
              <select
                name="departamento"
                value={formData.departamento}
                onChange={handleInputChange}
                className="acol-select"
              >
                <option value="">Selecione um departamento</option>
                <option value="recepção">Recepção</option>
                <option value="consultas">Consultas</option>
                <option value="administrativo">Administrativo</option>
                <option value="financeiro">Financeiro</option>
              </select>
            </div>

            <div className="acol-field">
              <label className="acol-label">Cargo</label>
              <input
                type="text"
                name="cargo"
                value={formData.cargo}
                onChange={handleInputChange}
                className="acol-select"
                placeholder="Cargo do colaborador"
              />
            </div>

            <div className="acol-field">
              <label className="acol-label">Especialidade</label>
              <input
                type="text"
                name="especialidade"
                value={formData.especialidade}
                onChange={handleInputChange}
                className="acol-select"
                placeholder="Especialidade (se aplicável)"
              />
            </div>

            <div className="acol-field">
              <label className="acol-label">Status</label>
              <div className="acol-seg">
                <button
                  className={`acol-seg-btn ${formData.ativo ? 'is-active' : ''}`}
                  onClick={() => setFormData(prev => ({ ...prev, ativo: true }))}
                >
                  Ativo
                </button>
                <button
                  className={`acol-seg-btn ${!formData.ativo ? 'is-active' : ''}`}
                  onClick={() => setFormData(prev => ({ ...prev, ativo: false }))}
                >
                  Inativo
                </button>
              </div>
            </div>
          </div>

          {/* Erro */}
          {error && <div className="acol-error">{error}</div>}

          {/* Botão Principal */}
          <div className="acol-sticky">
            <button className="acol-primary" onClick={handleAddColaborador}>
              {selectedColaborador ? 'Atualizar Colaborador' : 'Adicionar Colaborador'}
            </button>
          </div>
        </div>

        {/* Right Column */}
        <div className="acol-right">
          {/* Pesquisa */}
          <div className="acol-card">
            <div className="acol-card-title">Buscar Colaborador</div>
            <div className="acol-collaborator-row">
              <div className="acol-collaborator-search">
                <input
                  type="text"
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  placeholder="Buscar por nome ou email..."
                />
              </div>
            </div>
          </div>

          {/* Lista de Colaboradores */}
          <div className="acol-card">
            <div className="acol-right-head">
              <div className="acol-section-title">
                Colaboradores ({filteredColaboradores.length})
              </div>
              <div className="acol-tabs">
                <button
                  className={`acol-tab ${activeTab === 'todos' ? 'is-active' : ''}`}
                  onClick={() => setActiveTab('todos')}
                >
                  Todos
                </button>
                <button
                  className={`acol-tab ${activeTab === 'ativos' ? 'is-active' : ''}`}
                  onClick={() => setActiveTab('ativos')}
                >
                  Ativos
                </button>
              </div>
            </div>

            <div className="acol-list">
              {filteredColaboradores.length === 0 ? (
                <div className="acol-muted">
                  Nenhum colaborador encontrado
                </div>
              ) : (
                filteredColaboradores.map(col => (
                  <button
                    key={col.id}
                    className={`acol-list-btn ${selectedColaborador?.id === col.id ? 'is-selected' : ''}`}
                    onClick={() => handleSelectColaborador(col)}
                  >
                    <div className="acol-list-main">{col.nome}</div>
                    <div className="acol-list-sub">{col.cargo} • {col.departamento}</div>
                  </button>
                ))
              )}
            </div>
          </div>

          {/* Resumo */}
          {selectedColaborador && (
            <div className="acol-card">
              <div className="acol-summary-title">Resumo do Colaborador</div>
              <div className="acol-summary">
                <div className="acol-summary-row">
                  <strong>Nome:</strong>
                  <span>{selectedColaborador.nome}</span>
                </div>
                <div className="acol-summary-row">
                  <strong>Email:</strong>
                  <span>{selectedColaborador.email}</span>
                </div>
                <div className="acol-summary-row">
                  <strong>Departamento:</strong>
                  <span>{selectedColaborador.departamento}</span>
                </div>
                <div className="acol-summary-row">
                  <strong>Status:</strong>
                  <span className="acol-chip">
                    {selectedColaborador.ativo ? '✓ Ativo' : '✗ Inativo'}
                  </span>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
