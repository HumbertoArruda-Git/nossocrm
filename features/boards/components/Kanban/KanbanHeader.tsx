import React from 'react';
import { Plus, Search, LayoutGrid, Table as TableIcon, User, Settings, Lightbulb, Download } from 'lucide-react';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Button } from '@/components/ui/button';
import { Board } from '@/types';
import { BoardSelector } from '../BoardSelector';

interface KanbanHeaderProps {
    // Boards
    boards: Board[];
    activeBoard: Board;
    onSelectBoard: (id: string) => void;
    onCreateBoard: () => void;
    onEditBoard?: (board: Board) => void;
    onDeleteBoard?: (id: string) => void;
    onExportTemplates?: () => void;
    // View
    viewMode: 'kanban' | 'list';
    setViewMode: (mode: 'kanban' | 'list') => void;
    searchTerm: string;
    setSearchTerm: (term: string) => void;
    ownerFilter: 'all' | 'mine';
    setOwnerFilter: (filter: 'all' | 'mine') => void;
    sourceFilter: 'all' | 'WEBSITE';
    setSourceFilter: (filter: 'all' | 'WEBSITE') => void;
    statusFilter: 'open' | 'won' | 'lost' | 'all';
    setStatusFilter: (filter: 'open' | 'won' | 'lost' | 'all') => void;
    onNewDeal: () => void;
    prospectingFilters: ProspectingFilters;
    setProspectingFilters: React.Dispatch<React.SetStateAction<ProspectingFilters>>;
    onClearProspectingFilters: () => void;
    hasProspectingFilters: boolean;
}

export interface ProspectingFilters {
    category: string;
    priority: 'all' | '8' | '6';
    potential: 'all' | '8' | '6';
    hook: 'all' | 'forte' | 'moderado' | 'fraco';
}

/**
 * Componente React `KanbanHeader`.
 *
 * @param {KanbanHeaderProps} {
    boards,
    activeBoard,
    onSelectBoard,
    onCreateBoard,
    onEditBoard,
    onDeleteBoard,
    onExportTemplates,
    viewMode, setViewMode,
    searchTerm, setSearchTerm,
    ownerFilter, setOwnerFilter,
    sourceFilter, setSourceFilter,
    statusFilter, setStatusFilter,
    onNewDeal
} - Parâmetro `{
    boards,
    activeBoard,
    onSelectBoard,
    onCreateBoard,
    onEditBoard,
    onDeleteBoard,
    onExportTemplates,
    viewMode, setViewMode,
    searchTerm, setSearchTerm,
    ownerFilter, setOwnerFilter,
    statusFilter, setStatusFilter,
    onNewDeal
}`.
 * @returns {Element} Retorna um valor do tipo `Element`.
 */
export const KanbanHeader: React.FC<KanbanHeaderProps> = ({
    boards,
    activeBoard,
    onSelectBoard,
    onCreateBoard,
    onEditBoard,
    onDeleteBoard,
    onExportTemplates,
    viewMode, setViewMode,
    searchTerm, setSearchTerm,
    ownerFilter, setOwnerFilter,
    sourceFilter, setSourceFilter,
    statusFilter, setStatusFilter,
    onNewDeal,
    prospectingFilters,
    setProspectingFilters,
    onClearProspectingFilters,
    hasProspectingFilters
}) => {
    return (
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-6 gap-4">
            <div className="flex items-center gap-4 w-full sm:w-auto flex-wrap">
                {/* Board Selector */}
                <BoardSelector
                    boards={boards}
                    activeBoard={activeBoard}
                    onSelectBoard={onSelectBoard}
                    onCreateBoard={onCreateBoard}
                    onEditBoard={onEditBoard}
                    onDeleteBoard={onDeleteBoard}
                />

                {/* Edit Board Button */}
                {onEditBoard && (
                    <button
                        onClick={() => onEditBoard(activeBoard)}
                        className="p-2 text-slate-500 hover:text-slate-700 dark:text-slate-400 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-white/5 rounded-lg transition-colors"
                        title="Configurações do Board"
                    >
                        <Settings size={20} />
                    </button>
                )}

                {/* Export Template Button */}
                {onExportTemplates && (
                    <button
                        onClick={onExportTemplates}
                        className="p-2 text-slate-500 hover:text-slate-700 dark:text-slate-400 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-white/5 rounded-lg transition-colors"
                        title="Exportar template (comunidade)"
                    >
                        <Download size={20} />
                    </button>
                )}

                {/* Automation Guide Button */}
                {activeBoard.automationSuggestions && activeBoard.automationSuggestions.length > 0 && (
                    <Popover>
                        <PopoverTrigger asChild>
                            <button
                                className="p-2 text-yellow-600 hover:text-yellow-700 dark:text-yellow-400 dark:hover:text-yellow-300 hover:bg-yellow-50 dark:hover:bg-yellow-900/20 rounded-lg transition-colors relative group"
                                title="Automações Sugeridas"
                            >
                                <Lightbulb size={20} className="fill-current" />
                                <span className="absolute -top-1 -right-1 w-2 h-2 bg-red-500 rounded-full animate-pulse"></span>
                            </button>
                        </PopoverTrigger>
                        <PopoverContent className="w-80 p-0" align="start">
                            <div className="p-4 border-b border-slate-100 dark:border-white/10 bg-slate-50 dark:bg-slate-900/50">
                                <h4 className="font-semibold text-slate-900 dark:text-white flex items-center gap-2">
                                    <Lightbulb size={16} className="text-yellow-500" />
                                    Automações Sugeridas
                                </h4>
                                <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
                                    Dicas da IA para otimizar este processo.
                                </p>
                            </div>
                            <div className="p-2">
                                <ul className="space-y-1">
                                    {activeBoard.automationSuggestions.map((suggestion, idx) => (
                                        <li key={idx} className="text-sm text-slate-700 dark:text-slate-300 p-2 hover:bg-slate-50 dark:hover:bg-white/5 rounded-md flex gap-2 items-start">
                                            <span className="text-slate-400 mt-0.5">•</span>
                                            <span>{suggestion}</span>
                                        </li>
                                    ))}
                                </ul>
                            </div>
                        </PopoverContent>
                    </Popover>
                )}

                {/* VIEW TOGGLE */}
                <div className="flex bg-slate-100 dark:bg-white/5 p-1 rounded-lg border border-slate-200 dark:border-white/10">
                    <button
                        onClick={() => setViewMode('kanban')}
                        aria-label="Visualização em quadro Kanban"
                        aria-pressed={viewMode === 'kanban'}
                        className={`p-1.5 rounded-md transition-all ${viewMode === 'kanban' ? 'bg-white dark:bg-slate-700 shadow-sm text-primary-600 dark:text-white' : 'text-slate-500 hover:text-slate-700 dark:text-slate-400'}`}
                    >
                        <LayoutGrid size={16} aria-hidden="true" />
                    </button>
                    <button
                        onClick={() => setViewMode('list')}
                        aria-label="Visualização em lista"
                        aria-pressed={viewMode === 'list'}
                        className={`p-1.5 rounded-md transition-all ${viewMode === 'list' ? 'bg-white dark:bg-slate-700 shadow-sm text-primary-600 dark:text-white' : 'text-slate-500 hover:text-slate-700 dark:text-slate-400'}`}
                    >
                        <TableIcon size={16} aria-hidden="true" />
                    </button>
                </div>

                <div className="h-8 w-px bg-slate-200 dark:bg-white/10 mx-2 hidden sm:block"></div>
                <div className="relative flex-1 sm:w-64">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={16} />
                    <input
                        type="text"
                        placeholder="Filtrar negócios ou empresas..."
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                        className="w-full pl-10 pr-4 py-2 rounded-lg border border-slate-200 dark:border-slate-700 bg-white/50 dark:bg-white/5 text-sm outline-none focus:ring-2 focus:ring-primary-500 dark:text-white backdrop-blur-sm"
                    />
                </div>
                <div className="relative">
                    <select
                        value={statusFilter}
                        onChange={(e) => setStatusFilter(e.target.value as any)}
                        aria-label="Filtrar por status"
                        className="pl-3 pr-8 py-2 rounded-lg border border-slate-200 dark:border-slate-700 bg-white/50 dark:bg-slate-900 text-sm outline-none focus:ring-2 focus:ring-primary-500 dark:text-white dark:[color-scheme:dark] dark:[&>option]:bg-slate-900 dark:[&>option]:text-white backdrop-blur-sm appearance-none cursor-pointer"
                    >
                        <option value="open">Em Aberto</option>
                        <option value="won">Ganhos</option>
                        <option value="lost">Perdidos</option>
                        <option value="all">Todos</option>
                    </select>
                    <div className="absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none">
                        <div className={`w-2 h-2 rounded-full ${statusFilter === 'open' ? 'bg-blue-500' :
                            statusFilter === 'won' ? 'bg-green-500' :
                                statusFilter === 'lost' ? 'bg-red-500' : 'bg-slate-400'
                            }`} />
                    </div>
                </div>

                <div className="relative flex items-center gap-2">
                    <label htmlFor="pipeline-source-filter" className="text-sm text-slate-500 dark:text-slate-400">Origem</label>
                    <select
                        id="pipeline-source-filter"
                        value={sourceFilter}
                        onChange={(e) => setSourceFilter(e.target.value as 'all' | 'WEBSITE')}
                        aria-label="Filtrar por origem"
                        className="pl-3 pr-8 py-2 rounded-lg border border-slate-200 dark:border-slate-700 bg-white/50 dark:bg-slate-900 text-sm outline-none focus:ring-2 focus:ring-primary-500 dark:text-white dark:[color-scheme:dark] dark:[&>option]:bg-slate-900 dark:[&>option]:text-white backdrop-blur-sm appearance-none cursor-pointer"
                    >
                        <option value="all">Todos</option>
                        <option value="WEBSITE">Website</option>
                    </select>
                    <span className="absolute right-3 top-1/2 -translate-y-1/2 text-xs text-slate-400 pointer-events-none">⌄</span>
                </div>

                <div className="relative">
                    <select
                        value={ownerFilter}
                        onChange={(e) => setOwnerFilter(e.target.value as 'all' | 'mine')}
                        aria-label="Filtrar negócios por proprietário"
                        className="pl-3 pr-8 py-2 rounded-lg border border-slate-200 dark:border-slate-700 bg-white/50 dark:bg-slate-900 text-sm outline-none focus:ring-2 focus:ring-primary-500 dark:text-white dark:[color-scheme:dark] dark:[&>option]:bg-slate-900 dark:[&>option]:text-white backdrop-blur-sm appearance-none cursor-pointer"
                    >
                        <option value="all">Todos os Donos</option>
                        <option value="mine">Meus Negócios</option>
                    </select>
                    <User className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none" size={14} />
                </div>

                {activeBoard.key === 'prospeccao-comercial' && (
                    <div className="basis-full flex flex-wrap items-center gap-2 pt-1">
                        <span className="text-xs font-medium text-slate-500 dark:text-slate-400">Filtros rápidos</span>
                        <select
                            value={prospectingFilters.category}
                            onChange={(e) => setProspectingFilters(current => ({ ...current, category: e.target.value }))}
                            aria-label="Filtrar por categoria"
                            className="max-w-full pl-3 pr-8 py-1.5 rounded-lg border border-slate-200 dark:border-slate-700 bg-white/50 dark:bg-slate-900 dark:text-white dark:[color-scheme:dark] dark:[&>option]:bg-slate-900 dark:[&>option]:text-white text-xs outline-none focus:ring-2 focus:ring-primary-500 backdrop-blur-sm appearance-none cursor-pointer"
                        >
                            <option value="all">Todas as categorias</option>
                            {['Restaurante', 'Clínica', 'Oficina', 'Loja', 'Academia', 'Hotel', 'Contabilidade', 'Salão', 'Escola', 'Pet', 'Imobiliária', 'Outro'].map(category => (
                                <option key={category} value={category}>{category}</option>
                            ))}
                        </select>
                        <select
                            value={prospectingFilters.priority}
                            onChange={(e) => setProspectingFilters(current => ({ ...current, priority: e.target.value as ProspectingFilters['priority'] }))}
                            aria-label="Filtrar por prioridade de prospecção"
                            className="pl-3 pr-8 py-1.5 rounded-lg border border-slate-200 dark:border-slate-700 bg-white/50 dark:bg-slate-900 dark:text-white dark:[color-scheme:dark] dark:[&>option]:bg-slate-900 dark:[&>option]:text-white text-xs outline-none focus:ring-2 focus:ring-primary-500 backdrop-blur-sm appearance-none cursor-pointer"
                        >
                            <option value="all">Prioridade: Todas</option>
                            <option value="8">Prioridade: 8+</option>
                            <option value="6">Prioridade: 6+</option>
                        </select>
                        <select
                            value={prospectingFilters.potential}
                            onChange={(e) => setProspectingFilters(current => ({ ...current, potential: e.target.value as ProspectingFilters['potential'] }))}
                            aria-label="Filtrar por potencial comercial"
                            className="pl-3 pr-8 py-1.5 rounded-lg border border-slate-200 dark:border-slate-700 bg-white/50 dark:bg-slate-900 dark:text-white dark:[color-scheme:dark] dark:[&>option]:bg-slate-900 dark:[&>option]:text-white text-xs outline-none focus:ring-2 focus:ring-primary-500 backdrop-blur-sm appearance-none cursor-pointer"
                        >
                            <option value="all">Potencial: Todos</option>
                            <option value="8">Potencial: 8+</option>
                            <option value="6">Potencial: 6+</option>
                        </select>
                        <select
                            value={prospectingFilters.hook}
                            onChange={(e) => setProspectingFilters(current => ({ ...current, hook: e.target.value as ProspectingFilters['hook'] }))}
                            aria-label="Filtrar por qualidade do gancho"
                            className="pl-3 pr-8 py-1.5 rounded-lg border border-slate-200 dark:border-slate-700 bg-white/50 dark:bg-slate-900 dark:text-white dark:[color-scheme:dark] dark:[&>option]:bg-slate-900 dark:[&>option]:text-white text-xs outline-none focus:ring-2 focus:ring-primary-500 backdrop-blur-sm appearance-none cursor-pointer"
                        >
                            <option value="all">Gancho: Todos</option>
                            <option value="forte">Gancho: Forte</option>
                            <option value="moderado">Gancho: Moderado</option>
                            <option value="fraco">Gancho: Fraco</option>
                        </select>
                        {hasProspectingFilters && (
                            <button
                                type="button"
                                onClick={onClearProspectingFilters}
                                className="px-2 py-1.5 text-xs font-medium text-primary-700 dark:text-primary-300 hover:underline"
                            >
                                Limpar filtros
                            </button>
                        )}
                    </div>
                )}
            </div>

            <div className="flex gap-3">
                <Button
                    onClick={onNewDeal}
                    size="sm"
                    className="gap-2 bg-primary-700 hover:bg-primary-600 text-white shadow-lg shadow-primary-700/20"
                >
                    <Plus size={18} aria-hidden="true" /> Novo Negócio
                </Button>
            </div>
        </div>
    );
};
