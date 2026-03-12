import React, { useState, useEffect, useRef, useCallback } from 'react';
import { Form, Button, Alert, Spinner, Row, Col } from 'react-bootstrap';
import { Typeahead } from 'react-bootstrap-typeahead';
import 'react-bootstrap-typeahead/css/Typeahead.css';
import { branchService } from '../services/branchService';
import { itemService } from '../services/itemService';
import { useAuth } from '../hooks/useAuth';
import { useBranchSelection } from '../hooks/useBranchSelection';
import { formatUnit } from '../utils/formatters';
import { translateError } from '../utils/errorTranslator';

const ITEMS_PAGE_SIZE = 20;
const SEARCH_DEBOUNCE_MS = 300;

const OPERATION_TYPE_OPTIONS = [
  { value: 'IN', label: 'Entrada' },
  { value: 'OUT', label: 'Salida' },
  { value: 'TRANSFER', label: 'Traspaso' },
  { value: 'ADJUSTMENT', label: 'Ajuste' },
];

const OPERATION_TYPE_LABELS = {
  IN: 'Entrada',
  OUT: 'Salida',
  TRANSFER: 'Traspaso',
  ADJUSTMENT: 'Ajuste',
};

const normalizeArrayResponse = (response) => {
  if (Array.isArray(response)) return response;
  if (Array.isArray(response?.data)) return response.data;
  return [];
};

export const TransactionForm = ({
  transaction,
  onSubmit,
  onCancel,
  loading = false,
  error: externalError = null,
  onErrorChange = null,
}) => {
  const { user } = useAuth();
  const { selectedBranchId } = useBranchSelection();
  const isEditMode = !!transaction;

  // If user has a fixed branch, we never show the branch select and always use that value
  const userBranchId = user?.branch_id ? String(user.branch_id) : null;

  const defaultBranchId = userBranchId || (selectedBranchId ? String(selectedBranchId) : '');

  const [formData, setFormData] = useState({
    operation_type: 'IN',
    branch_id: defaultBranchId,
    destination_branch_id: '',
    description: '',
  });

  const [branches, setBranches] = useState([]);

  // Typeahead item search state
  const [itemOptions, setItemOptions] = useState([]);
  const [loadingItems, setLoadingItems] = useState(false);
  const [itemSearchQuery, setItemSearchQuery] = useState('');
  const [itemPage, setItemPage] = useState(1);
  const [itemTotalPages, setItemTotalPages] = useState(1);
  const debounceRef = useRef(null);

  const [typeaheadSelected, setTypeaheadSelected] = useState([]);
  const [lineQuantities, setLineQuantities] = useState({});
  const [loadingData, setLoadingData] = useState(false);
  const [dataError, setDataError] = useState(null);
  const [internalError, setInternalError] = useState(null);

  const displayError = externalError || internalError;

  // Fetch items for the typeahead (server-side search + pagination)
  const fetchItems = useCallback(async (search, page, append = false) => {
    setLoadingItems(true);
    try {
      const res = await itemService.listItems({
        is_active: true,
        search: search || undefined,
        page,
        page_size: ITEMS_PAGE_SIZE,
      });
      const items = normalizeArrayResponse(res);
      const totalPages = res?.totalPages ?? res?.total_pages ?? 1;
      setItemTotalPages(totalPages);
      setItemOptions((prev) => (append ? [...prev, ...items] : items));
    } catch (err) {
      setDataError(translateError(err));
    } finally {
      setLoadingItems(false);
    }
  }, []);

  // Load branches on mount; initial item load (empty search)
  useEffect(() => {
    const fetchData = async () => {
      setLoadingData(true);
      try {
        const branchesRes = await branchService.getBranches({ is_active: true });
        setBranches(normalizeArrayResponse(branchesRes));
      } catch (err) {
        setDataError(translateError(err));
      } finally {
        setLoadingData(false);
      }
    };
    fetchData();
    fetchItems('', 1, false);
  }, [fetchItems]);

  // Debounced input change → reset to page 1 and search
  const handleItemInputChange = (text) => {
    setItemSearchQuery(text);
    setItemPage(1);
    if (debounceRef.current) clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(() => {
      fetchItems(text, 1, false);
    }, SEARCH_DEBOUNCE_MS);
  };

  // Paginate → load next page and append
  const handleItemPaginate = () => {
    const nextPage = itemPage + 1;
    setItemPage(nextPage);
    fetchItems(itemSearchQuery, nextPage, true);
  };

  // Populate form from transaction in edit mode
  useEffect(() => {
    if (!isEditMode || !transaction) return;

    setFormData({
      operation_type: transaction.operation_type || 'IN',
      branch_id: transaction.branch_id ? String(transaction.branch_id) : '',
      destination_branch_id: transaction.destination_branch_id
        ? String(transaction.destination_branch_id)
        : '',
      description: transaction.description || '',
    });
  }, [transaction, isEditMode]);

  // Populate lines in edit mode: fetch each item by id if not already in options
  useEffect(() => {
    if (!isEditMode || !transaction?.lines?.length) return;

    const loadEditLines = async () => {
      const quantities = {};
      const selected = [];

      for (const line of transaction.lines) {
        try {
          // Try to find in already-loaded options first
          let item = itemOptions.find((i) => i.id === line.item_id);
          if (!item) {
            item = await itemService.getItemById(line.item_id);
          }
          if (item) {
            selected.push(item);
            quantities[item.id] = String(line.quantity);
          }
        } catch {
          // Skip items that can't be fetched
        }
      }

      setTypeaheadSelected(selected);
      setLineQuantities(quantities);
    };

    loadEditLines();
    // Only run when the transaction changes (not on every itemOptions update)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [transaction, isEditMode]);

  const clearError = () => {
    setInternalError(null);
    if (onErrorChange) onErrorChange(null);
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
    clearError();
  };

  const handleTypeaheadChange = (selected) => {
    setTypeaheadSelected(selected);
    setLineQuantities((prev) => {
      const updated = {};
      for (const item of selected) {
        // Preserve existing quantity or default to 1
        updated[item.id] = prev[item.id] !== undefined ? prev[item.id] : '1';
      }
      return updated;
    });
  };

  const handleQuantityChange = (itemId, value) => {
    setLineQuantities((prev) => ({ ...prev, [itemId]: value }));
  };

  const validateForm = () => {
    if (!isEditMode && !formData.operation_type) {
      setInternalError('El tipo de operación es obligatorio');
      return false;
    }
    const effectiveBranchId = userBranchId || formData.branch_id;
    if (!isEditMode && !effectiveBranchId) {
      setInternalError('La sede es obligatoria');
      return false;
    }
    if (!isEditMode && formData.operation_type === 'TRANSFER') {
      if (!formData.destination_branch_id) {
        setInternalError('La sede de destino es obligatoria para traspasos');
        return false;
      }
      if (formData.destination_branch_id === effectiveBranchId) {
        setInternalError('La sede de destino no puede ser la misma que la sede de origen');
        return false;
      }
    }
    if (typeaheadSelected.length === 0) {
      setInternalError('Debes añadir al menos un artículo');
      return false;
    }
    for (const item of typeaheadSelected) {
      const qty = parseFloat(lineQuantities[item.id]);
      if (!qty || qty < 0.001) {
        setInternalError(`La cantidad de "${item.name}" debe ser mayor que 0`);
        return false;
      }
    }
    if (formData.description && formData.description.length > 1000) {
      setInternalError('La descripción no puede exceder 1000 caracteres');
      return false;
    }
    return true;
  };

  const buildSubmitHandler = (autoComplete) => () => {
    if (!validateForm()) return;

    const lines = typeaheadSelected.map((item) => ({
      item_id: item.id,
      quantity: parseFloat(lineQuantities[item.id]),
    }));

    let payload;
    if (isEditMode) {
      payload = { lines, auto_complete: autoComplete };
      if (formData.description) payload.description = formData.description;
    } else {
      const effectiveBranchId = userBranchId
        ? Number(userBranchId)
        : Number(formData.branch_id);
      payload = {
        operation_type: formData.operation_type,
        branch_id: effectiveBranchId,
        lines,
        auto_complete: autoComplete,
      };
      if (formData.description) payload.description = formData.description;
      if (
        formData.operation_type === 'TRANSFER' &&
        formData.destination_branch_id
      ) {
        payload.destination_branch_id = Number(formData.destination_branch_id);
      }
    }

    onSubmit(payload);
  };

  const isTransfer = formData.operation_type === 'TRANSFER';
  const effectiveBranchId = userBranchId || formData.branch_id;

  const destinationBranchOptions = branches.filter(
    (b) => String(b.id) !== effectiveBranchId,
  );

  if (loadingData) {
    return (
      <div className="text-center py-4">
        <Spinner animation="border" size="sm" className="me-2" />
        Cargando datos...
      </div>
    );
  }

  return (
    <Form>
      {displayError && (
        <Alert variant="danger" onClose={clearError} dismissible>
          {displayError}
        </Alert>
      )}

      {dataError && <Alert variant="warning">{dataError}</Alert>}

      {/* Tipo de operación */}
      <Form.Group className="mb-3">
        <Form.Label>
          Tipo de operación{!isEditMode && <span className="text-danger"> *</span>}
        </Form.Label>
        {isEditMode ? (
          <Form.Control
            type="text"
            value={OPERATION_TYPE_LABELS[formData.operation_type] || formData.operation_type}
            readOnly
            disabled
          />
        ) : (
          <Form.Select
            name="operation_type"
            value={formData.operation_type}
            onChange={handleChange}
            disabled={loading}
            style={{ height: '46px' }}
          >
            {OPERATION_TYPE_OPTIONS.map((opt) => (
              <option key={opt.value} value={opt.value}>
                {opt.label}
              </option>
            ))}
          </Form.Select>
        )}
      </Form.Group>

      {/* Sede (hidden if user has a fixed branch) */}
      {!userBranchId && (
        <Form.Group className="mb-3">
          <Form.Label>
            Sede{!isEditMode && <span className="text-danger"> *</span>}
          </Form.Label>
          {isEditMode ? (
            <Form.Control
              type="text"
              value={
                branches.find((b) => String(b.id) === formData.branch_id)?.name ||
                formData.branch_id
              }
              readOnly
              disabled
            />
          ) : (
            <Form.Select
              name="branch_id"
              value={formData.branch_id}
              onChange={handleChange}
              disabled={loading}
              style={{ height: '46px' }}
            >
              <option value="">-- Selecciona una sede --</option>
              {branches.map((b) => (
                <option key={b.id} value={String(b.id)}>
                  {b.name}
                </option>
              ))}
            </Form.Select>
          )}
        </Form.Group>
      )}

      {/* Sede de destino (solo para Traspaso) */}
      {isTransfer && (
        <Form.Group className="mb-3">
          <Form.Label>
            Sede de destino{!isEditMode && <span className="text-danger"> *</span>}
          </Form.Label>
          {isEditMode ? (
            <Form.Control
              type="text"
              value={
                branches.find((b) => String(b.id) === formData.destination_branch_id)
                  ?.name || formData.destination_branch_id
              }
              readOnly
              disabled
            />
          ) : (
            <Form.Select
              name="destination_branch_id"
              value={formData.destination_branch_id}
              onChange={handleChange}
              disabled={loading}
              style={{ height: '46px' }}
            >
              <option value="">-- Selecciona sede de destino --</option>
              {destinationBranchOptions.map((b) => (
                <option key={b.id} value={String(b.id)}>
                  {b.name}
                </option>
              ))}
            </Form.Select>
          )}
        </Form.Group>
      )}

      {/* Descripción */}
      <Form.Group className="mb-3">
        <Form.Label>Descripción</Form.Label>
        <Form.Control
          as="textarea"
          rows={2}
          name="description"
          value={formData.description}
          onChange={handleChange}
          placeholder="Descripción de la operación (opcional)"
          maxLength={1000}
          disabled={loading}
        />
        <Form.Text className="text-muted">{formData.description.length}/1000</Form.Text>
      </Form.Group>

      {/* Selector de artículos con Typeahead */}
      <Form.Group className="mb-2">
        <Form.Label>
          Artículos <span className="text-danger">*</span>
        </Form.Label>
        <Typeahead
          id="transaction-items-typeahead"
          multiple
          options={itemOptions}
          selected={typeaheadSelected}
          onChange={handleTypeaheadChange}
          onInputChange={handleItemInputChange}
          onPaginate={handleItemPaginate}
          paginate={itemPage < itemTotalPages}
          maxResults={ITEMS_PAGE_SIZE}
          labelKey={(option) => `${option.name} (${option.sku})`}
          filterBy={() => true}
          placeholder="Buscar por nombre o SKU..."
          disabled={loading}
          isLoading={loadingItems}
          emptyLabel="No se encontraron artículos"
          paginationText="Cargar más resultados..."
        />
      </Form.Group>

      {/* Lista de artículos con cantidades */}
      {typeaheadSelected.length > 0 && (
        <div
          className="mb-4 p-3"
          style={{
            border: '1px solid #dee2e6',
            borderRadius: '0.375rem',
            backgroundColor: '#f8f9fa',
          }}
        >
          <Row className="mb-1">
            <Col xs={6} md={7}>
              <small className="text-muted fw-semibold">Artículo</small>
            </Col>
            <Col xs={4} md={3}>
              <small className="text-muted fw-semibold">Cantidad</small>
            </Col>
            <Col xs={2}>
              <small className="text-muted fw-semibold">Unidad</small>
            </Col>
          </Row>
          {typeaheadSelected.map((item) => (
            <Row key={item.id} className="align-items-center mb-2">
              <Col xs={6} md={7}>
                <span className="fw-medium" style={{ fontSize: '0.9rem' }}>
                  {item.name}
                </span>
                <small className="text-muted ms-2">{item.sku}</small>
              </Col>
              <Col xs={4} md={3}>
                <Form.Control
                  type="number"
                  value={lineQuantities[item.id] || ''}
                  onChange={(e) => handleQuantityChange(item.id, e.target.value)}
                  placeholder="0"
                  min="0.001"
                  step="0.001"
                  disabled={loading}
                  size="sm"
                />
              </Col>
              <Col xs={2}>
                <small className="text-muted">{formatUnit(item.unit)}</small>
              </Col>
            </Row>
          ))}
        </div>
      )}

      {/* Botones */}
      <div className="d-flex gap-2 justify-content-end flex-wrap mt-3">
        <Button variant="secondary" onClick={onCancel} disabled={loading}>
          Cancelar
        </Button>
        <Button
          variant="primary"
          onClick={buildSubmitHandler(false)}
          disabled={loading}
        >
          {loading ? (
            <>
              <Spinner as="span" animation="border" size="sm" className="me-2" />
              Guardando...
            </>
          ) : isEditMode ? (
            'Actualizar'
          ) : (
            'Crear'
          )}
        </Button>
        <Button
          variant="success"
          onClick={buildSubmitHandler(true)}
          disabled={loading}
        >
          {loading ? (
            <>
              <Spinner as="span" animation="border" size="sm" className="me-2" />
              Guardando...
            </>
          ) : isEditMode ? (
            'Actualizar + Completar'
          ) : (
            'Crear + Completar'
          )}
        </Button>
      </div>
    </Form>
  );
};

export default TransactionForm;
