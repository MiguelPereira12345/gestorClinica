import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import AppLayout from './components/Layout/AppLayout';
import { isValidName, isValidPhone, sanitizeName, sanitizePhone } from './utils/validation';

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
  const [activeTab, setActiveTab] = useState('todos');
  const [error, setError] = useState('');

  const handleInputChange = (e) => {
    const { name, value } = e.target;

    let nextValue = value;
    if (name === 'nome') nextValue = sanitizeName(value);
    if (name === 'telefone') nextValue = sanitizePhone(value);

    setFormData(prev => ({ ...prev, [name]: nextValue }));
  };

  const handleAddColaborador = () => {
    const nome = sanitizeName(formData.nome).trim();
    const email = String(formData.email || '').trim();
    const telefone = sanitizePhone(formData.telefone).trim();

    if (!nome || !email) {
      setError('Nome e email são obrigatórios');
      return;
    }

    if (!isValidName(nome)) {
      setError('Nome inválido. Use apenas letras e espaços.');
      return;
    }

    if (telefone && !isValidPhone(telefone)) {
      setError('Telefone inválido. Indica um número com 9 a 15 dígitos.');
      return;
    }

    const nextFormData = {
      ...formData,
      nome,
      email,
      telefone,
    };

    const novoColaborador = {
      id: Date.now(),
      ...nextFormData,
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
    <AppLayout
      breadcrumb="Colaboradores / Adicionar"
      userName="Receção"
      actions={
        <button type="button" className="btn btn-secondary" onClick={() => navigate('/colaboradores')}>
          ← Voltar
        </button>
      }
    >
      <div className="ui-page">
        <div className="row g-3">
          <section className="col-12 col-lg-5" aria-label="Formulário">
            <div className="position-sticky" style={{ top: 12 }}>
              <div className="ui-card p-3">
                <div className="fw-bold">Dados Pessoais</div>

                <div className="mt-3">
                  <label className="form-label">Nome Completo</label>
                  <input
                    type="text"
                    name="nome"
                    value={formData.nome}
                    onChange={handleInputChange}
                    className="form-control"
                    placeholder="Insira o nome completo"
                  />
                </div>

                <div className="mt-3">
                  <label className="form-label">Email</label>
                  <input
                    type="email"
                    name="email"
                    value={formData.email}
                    onChange={handleInputChange}
                    className="form-control"
                    placeholder="email@exemplo.com"
                  />
                </div>

                <div className="mt-3">
                  <label className="form-label">Telefone</label>
                  <input
                    type="tel"
                    name="telefone"
                    value={formData.telefone}
                    onChange={handleInputChange}
                    className="form-control"
                    placeholder="Ex: 912345678"
                    inputMode="tel"
                    maxLength={16}
                  />
                </div>
              </div>

              <div className="ui-card p-3 mt-3">
                <div className="fw-bold">Informações Profissionais</div>

                <div className="mt-3">
                  <label className="form-label">Departamento</label>
                  <select
                    name="departamento"
                    value={formData.departamento}
                    onChange={handleInputChange}
                    className="form-select"
                  >
                    <option value="">Selecione um departamento</option>
                    <option value="recepção">Recepção</option>
                    <option value="consultas">Consultas</option>
                    <option value="administrativo">Administrativo</option>
                    <option value="financeiro">Financeiro</option>
                  </select>
                </div>

                <div className="mt-3">
                  <label className="form-label">Cargo</label>
                  <input
                    type="text"
                    name="cargo"
                    value={formData.cargo}
                    onChange={handleInputChange}
                    className="form-control"
                    placeholder="Cargo do colaborador"
                  />
                </div>

                <div className="mt-3">
                  <label className="form-label">Especialidade</label>
                  <input
                    type="text"
                    name="especialidade"
                    value={formData.especialidade}
                    onChange={handleInputChange}
                    className="form-control"
                    placeholder="Especialidade (se aplicável)"
                  />
                </div>

                <div className="mt-3">
                  <label className="form-label">Estado</label>
                  <div className="btn-group w-100" role="group" aria-label="Estado">
                    <button
                      type="button"
                      className={`btn btn-sm ${formData.ativo ? 'btn-primary' : 'btn-light'}`}
                      onClick={() => setFormData(prev => ({ ...prev, ativo: true }))}
                    >
                      Ativo
                    </button>
                    <button
                      type="button"
                      className={`btn btn-sm ${!formData.ativo ? 'btn-primary' : 'btn-light'}`}
                      onClick={() => setFormData(prev => ({ ...prev, ativo: false }))}
                    >
                      Inativo
                    </button>
                  </div>
                </div>
              </div>

              {error ? (
                <div className="alert alert-danger py-2 mt-3 mb-0" role="alert">
                  {error}
                </div>
              ) : null}

              <button type="button" className="btn btn-primary w-100 mt-3" onClick={handleAddColaborador}>
                {selectedColaborador ? 'Atualizar Colaborador' : 'Adicionar Colaborador'}
              </button>
            </div>
          </section>

          <aside className="col-12 col-lg-7" aria-label="Lista">
            <div className="ui-card p-3">
              <div className="fw-bold">Buscar Colaborador</div>
              <div className="mt-3">
                <input
                  type="text"
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="form-control"
                  placeholder="Buscar por nome ou email..."
                />
              </div>
            </div>

            <div className="ui-card p-3 mt-3">
              <div className="d-flex justify-content-between align-items-start gap-2 flex-wrap mb-3">
                <div>
                  <div className="fw-bold">Colaboradores</div>
                  <div className="ui-meta">{filteredColaboradores.length} resultado(s)</div>
                </div>
                <div className="btn-group" role="tablist" aria-label="Filtro">
                  <button
                    type="button"
                    className={`btn btn-sm ${activeTab === 'todos' ? 'btn-primary' : 'btn-light'}`}
                    onClick={() => setActiveTab('todos')}
                  >
                    Todos
                  </button>
                  <button
                    type="button"
                    className={`btn btn-sm ${activeTab === 'ativos' ? 'btn-primary' : 'btn-light'}`}
                    onClick={() => setActiveTab('ativos')}
                  >
                    Ativos
                  </button>
                </div>
              </div>

              {filteredColaboradores.length === 0 ? (
                <div className="ui-meta">Nenhum colaborador encontrado</div>
              ) : (
                <div className="list-group">
                  {filteredColaboradores.map(col => {
                    const isActive = selectedColaborador?.id === col.id;
                    return (
                      <button
                        key={col.id}
                        type="button"
                        className={`list-group-item list-group-item-action${isActive ? ' active' : ''}`}
                        onClick={() => handleSelectColaborador(col)}
                      >
                        <div className="fw-semibold">{col.nome}</div>
                        <div className={isActive ? 'text-white-50 small' : 'text-muted small'}>
                          {col.cargo} • {col.departamento}
                        </div>
                      </button>
                    );
                  })}
                </div>
              )}
            </div>

            {selectedColaborador ? (
              <div className="ui-card p-3 mt-3">
                <div className="fw-bold mb-2">Resumo do Colaborador</div>
                <div className="d-grid gap-2">
                  <div><strong>Nome:</strong> {selectedColaborador.nome}</div>
                  <div><strong>Email:</strong> {selectedColaborador.email}</div>
                  <div><strong>Departamento:</strong> {selectedColaborador.departamento}</div>
                  <div>
                    <strong>Estado:</strong>{' '}
                    <span className={`badge ${selectedColaborador.ativo ? 'text-bg-success' : 'text-bg-secondary'}`}>
                      {selectedColaborador.ativo ? 'Ativo' : 'Inativo'}
                    </span>
                  </div>
                </div>
              </div>
            ) : null}
          </aside>
        </div>
      </div>
    </AppLayout>
  );
}
