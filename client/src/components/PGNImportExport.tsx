import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { Upload, Download, Eye, AlertCircle, CheckCircle } from 'lucide-react';
import { toast } from 'sonner';
import { trpc } from '@/lib/trpc';

interface PGNImportExportProps {
  onGameImported?: (gameId: number) => void;
  gameId?: number;
}

export default function PGNImportExport({ onGameImported, gameId }: PGNImportExportProps) {
  const [isImportOpen, setIsImportOpen] = useState(false);
  const [pgnText, setPgnText] = useState('');
  const [importTitle, setImportTitle] = useState('');
  const [importNotes, setImportNotes] = useState('');
  const [previewData, setPreviewData] = useState<any>(null);
  const [isPreviewOpen, setIsPreviewOpen] = useState(false);
  const [isDragging, setIsDragging] = useState(false);

  // tRPC mutations
  const previewPGN = trpc.pgnIO.previewPGN.useQuery(
    { pgnText },
    { enabled: false }
  );

  const importPGNMutation = trpc.pgnIO.importPGN.useMutation({
    onSuccess: (data) => {
      toast.success(`Partida importada com sucesso! ${data.stats.totalMoves} lances`);
      setPgnText('');
      setImportTitle('');
      setImportNotes('');
      setIsImportOpen(false);
      if (onGameImported) {
        onGameImported(data.gameId);
      }
    },
    onError: (error) => {
      toast.error(`Erro ao importar: ${error.message}`);
    },
  });

  const exportGameMutation = trpc.pgnIO.exportGame.useQuery(
    { gameId: gameId || 0 },
    { enabled: false }
  );

  const handlePreview = async () => {
    if (!pgnText.trim()) {
      toast.error('Cole um PGN válido');
      return;
    }

    try {
      const result = await previewPGN.refetch();
      if (result.data?.valid) {
        setPreviewData(result.data.preview);
        setIsPreviewOpen(true);
      } else {
        toast.error(`Erro no PGN: ${result.data?.errors?.join(', ')}`);
      }
    } catch (error) {
      toast.error('Erro ao processar PGN');
    }
  };

  const handleImport = async () => {
    if (!pgnText.trim()) {
      toast.error('Cole um PGN válido');
      return;
    }

    importPGNMutation.mutate({
      pgnText,
      title: importTitle,
      notes: importNotes,
    });
  };

  const handleExport = async () => {
    if (!gameId) {
      toast.error('Nenhuma partida selecionada');
      return;
    }

    try {
      const result = await exportGameMutation.refetch();
      if (result.data?.pgn) {
        // Cria um blob e faz download
        const blob = new Blob([result.data.pgn], { type: 'text/plain' });
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = result.data.filename;
        document.body.appendChild(a);
        a.click();
        window.URL.revokeObjectURL(url);
        document.body.removeChild(a);
        toast.success('Partida exportada com sucesso!');
      }
    } catch (error) {
      toast.error('Erro ao exportar partida');
    }
  };

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = (event) => {
        const content = event.target?.result as string;
        setPgnText(content);
        toast.success('Arquivo carregado');
      };
      reader.readAsText(file);
    }
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  };

  const handleDragLeave = () => {
    setIsDragging(false);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    const file = e.dataTransfer.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = (event) => {
        const content = event.target?.result as string;
        setPgnText(content);
        toast.success('Arquivo carregado');
      };
      reader.readAsText(file);
    }
  };

  return (
    <div className="flex gap-4">
      {/* Botão de Importação */}
      <Button
        onClick={() => setIsImportOpen(true)}
        variant="outline"
        className="gap-2"
      >
        <Upload className="w-4 h-4" />
        Importar PGN
      </Button>

      {/* Botão de Exportação */}
      {gameId && (
        <Button
          onClick={handleExport}
          variant="outline"
          className="gap-2"
          disabled={exportGameMutation.isPending}
        >
          <Download className="w-4 h-4" />
          Exportar PGN
        </Button>
      )}

      {/* Dialog de Importação */}
      <Dialog open={isImportOpen} onOpenChange={setIsImportOpen}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Importar Partida PGN</DialogTitle>
            <DialogDescription>
              Cole um PGN ou faça upload de um arquivo .pgn
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4">
            {/* Área de Drag & Drop */}
            <div
              onDragOver={handleDragOver}
              onDragLeave={handleDragLeave}
              onDrop={handleDrop}
              className={`border-2 border-dashed rounded-lg p-8 text-center transition-colors ${
                isDragging
                  ? 'border-primary bg-primary/5'
                  : 'border-border hover:border-primary/50'
              }`}
            >
              <Upload className="w-8 h-8 mx-auto mb-2 text-muted-foreground" />
              <p className="text-sm text-muted-foreground mb-2">
                Arraste um arquivo .pgn aqui ou
              </p>
              <Input
                type="file"
                accept=".pgn,.txt"
                onChange={handleFileUpload}
                className="hidden"
                id="pgn-file"
              />
              <label htmlFor="pgn-file">
                <Button variant="secondary" size="sm" asChild>
                  <span>Selecione um arquivo</span>
                </Button>
              </label>
            </div>

            {/* Textarea para PGN */}
            <div>
              <label className="text-sm font-medium mb-2 block">
                Ou cole o PGN aqui:
              </label>
              <Textarea
                value={pgnText}
                onChange={(e) => setPgnText(e.target.value)}
                placeholder="Cole aqui um PGN válido com metadados e lances"
                className="font-mono text-xs h-40"
              />
            </div>

            {/* Campos de Metadados */}
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="text-sm font-medium mb-2 block">
                  Título (opcional)
                </label>
                <Input
                  value={importTitle}
                  onChange={(e) => setImportTitle(e.target.value)}
                  placeholder="Ex: Meu Treinamento - Ruy Lopez"
                />
              </div>
              <div>
                <label className="text-sm font-medium mb-2 block">
                  Notas (opcional)
                </label>
                <Input
                  value={importNotes}
                  onChange={(e) => setImportNotes(e.target.value)}
                  placeholder="Ex: Estudo de abertura"
                />
              </div>
            </div>

            {/* Botões de Ação */}
            <div className="flex gap-2 justify-end">
              <Button
                variant="outline"
                onClick={() => setIsImportOpen(false)}
              >
                Cancelar
              </Button>
              <Button
                variant="secondary"
                onClick={handlePreview}
                className="gap-2"
              >
                <Eye className="w-4 h-4" />
                Preview
              </Button>
              <Button
                onClick={handleImport}
                disabled={importPGNMutation.isPending || !pgnText.trim()}
                className="gap-2"
              >
                {importPGNMutation.isPending ? (
                  'Importando...'
                ) : (
                  <>
                    <Upload className="w-4 h-4" />
                    Importar
                  </>
                )}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Dialog de Preview */}
      <Dialog open={isPreviewOpen} onOpenChange={setIsPreviewOpen}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle>Preview da Partida</DialogTitle>
          </DialogHeader>

          {previewData && (
            <Card className="p-4 space-y-3">
              <div className="flex items-start gap-2">
                <CheckCircle className="w-5 h-5 text-green-600 mt-0.5 flex-shrink-0" />
                <div className="flex-1">
                  <p className="font-semibold">{previewData.title}</p>
                  <p className="text-sm text-muted-foreground">
                    {previewData.opening}
                  </p>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4 text-sm">
                <div>
                  <p className="text-muted-foreground">Total de Lances</p>
                  <p className="font-semibold">{previewData.totalMoves}</p>
                </div>
                <div>
                  <p className="text-muted-foreground">Elo Médio</p>
                  <p className="font-semibold">
                    {previewData.whiteElo && previewData.blackElo
                      ? Math.round(
                          (parseInt(previewData.whiteElo) +
                            parseInt(previewData.blackElo)) /
                            2
                        )
                      : 'N/A'}
                  </p>
                </div>
              </div>

              <div className="bg-muted p-3 rounded text-xs font-mono">
                <p className="text-muted-foreground mb-1">Primeiros lances:</p>
                <p>{previewData.firstMoves}</p>
              </div>

              <div className="flex gap-2 justify-end">
                <Button
                  variant="outline"
                  onClick={() => setIsPreviewOpen(false)}
                >
                  Voltar
                </Button>
                <Button
                  onClick={() => {
                    setIsPreviewOpen(false);
                    handleImport();
                  }}
                  className="gap-2"
                >
                  <CheckCircle className="w-4 h-4" />
                  Confirmar Importação
                </Button>
              </div>
            </Card>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
