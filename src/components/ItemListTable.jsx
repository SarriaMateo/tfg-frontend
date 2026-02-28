import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Spinner, Alert, Button, Form, Row, Col } from 'react-bootstrap';
import { OverlayTrigger, Tooltip } from 'react-bootstrap';
import { useAuth } from '../hooks/useAuth';
import { useBranchSelection } from '../hooks/useBranchSelection';
import { categoryService } from '../services/categoryService';
import { formatDecimal, formatPrice } from '../utils/formatters';

const DEFAULT_FILTERS = {
  search: '',
  is_active: '',
  category_id: '',
  unit: '',
  order_by: 'created_at',
  order_desc: 'true',
};

const queryToFilters = (query = {}) => ({
  search: query.search || '',
  is_active: query.is_active === undefined ? '' : String(query.is_active),
  category_id: query.category_id === undefined ? '' : String(query.category_id),
  unit: query.unit || '',
  order_by: query.order_by || 'created_at',
  order_desc: String(query.order_desc ?? true),
});

export const ItemListTable = ({ items, loading, error, pagination, initialQuery = {}, onFetchItems }) => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const { selectedBranchId } = useBranchSelection();
  const [categories, setCategories] = useState([]);
  const [loadingCategories, setLoadingCategories] = useState(false);
  const [filters, setFilters] = useState(() => queryToFilters(initialQuery));
  const [pageSize, setPageSize] = useState(() => Number(initialQuery?.pageSize) || 20);
  const inputControlStyle = { minHeight: '38px' };
  const selectControlStyle = { height: '46px' };
  const filterButtonStyle = { height: '46px', padding: '0 1rem' };
  const pageButtonStyle = { minWidth: '36px', height: '32px', padding: '0.25rem 0.5rem' };
  const currentPageButtonStyle = { minWidth: '40px', height: '34px', padding: '0.25rem 0.5rem' };

  useEffect(() => {
    if (pagination?.pageSize && pagination.pageSize !== pageSize) {
      setPageSize(pagination.pageSize);
    }
  }, [pagination?.pageSize, pageSize]);

  useEffect(() => {
    const loadCategories = async () => {
      setLoadingCategories(true);
      try {
        const response = await categoryService.getCategories();
        const categoryList = Array.isArray(response) ? response : (response?.data || []);
        setCategories(categoryList);
      } catch {
        setCategories([]);
      } finally {
        setLoadingCategories(false);
      }
    };

    loadCategories();
  }, []);

  useEffect(() => {
    if (!initialQuery || Object.keys(initialQuery).length === 0) return;
    setFilters(queryToFilters(initialQuery));
    setPageSize(Number(initialQuery.pageSize) || 20);
  }, [initialQuery]);

  const handleFilterChange = (event) => {
    const { name, value } = event.target;
    setFilters((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  const buildFetchPayload = ({ page = 1, nextPageSize = pageSize } = {}) => {
    const payload = {
      page,
      pageSize: nextPageSize,
      order_by: filters.order_by,
      order_desc: filters.order_desc === 'true',
    };

    if (filters.search.trim()) payload.search = filters.search.trim();
    if (filters.is_active !== '') payload.is_active = filters.is_active === 'true';
    if (filters.category_id !== '') payload.category_id = Number(filters.category_id);
    if (filters.unit) payload.unit = filters.unit;

    return payload;
  };

  const handleApplyFilters = () => {
    onFetchItems(buildFetchPayload({ page: 1 }));
  };

  const handleResetFilters = () => {
    setFilters(DEFAULT_FILTERS);
    setPageSize(20);
    onFetchItems({
      page: 1,
      pageSize: 20,
      order_by: 'created_at',
      order_desc: true,
    });
  };

  const handlePageChange = (nextPage) => {
    if (nextPage < 1 || nextPage > (pagination?.totalPages || 1)) return;
    onFetchItems(buildFetchPayload({ page: nextPage }));
  };

  const handlePageSizeChange = (event) => {
    const nextSize = Number(event.target.value);
    setPageSize(nextSize);
    onFetchItems(buildFetchPayload({ page: 1, nextPageSize: nextSize }));
  };

  const getVisiblePages = () => {
    const totalPages = pagination?.totalPages || 1;
    const currentPage = pagination?.page || 1;
    const maxVisible = 5;

    if (totalPages <= maxVisible) {
      return Array.from({ length: totalPages }, (_, index) => index + 1);
    }

    let startPage = Math.max(1, currentPage - Math.floor(maxVisible / 2));
    let endPage = startPage + maxVisible - 1;

    if (endPage > totalPages) {
      endPage = totalPages;
      startPage = endPage - maxVisible + 1;
    }

    return Array.from({ length: endPage - startPage + 1 }, (_, index) => startPage + index);
  };

  // Get the branch ID to display stock (user's branch or selected from localStorage)
  const getBranchIdForStock = () => {
    return user?.branch_id || selectedBranchId;
  };

  // Get stock for current branch
  const getBranchStock = (item) => {
    const branchId = getBranchIdForStock();
    if (!branchId) return '0';

    const branchStock = item.stock_by_branch?.find(
      (sb) => sb.branch_id === branchId
    );
    return branchStock ? formatDecimal(branchStock.stock) : '0';
  };

  // Get total stock across all branches
  const getTotalStock = (item) => {
    const total = item.stock_by_branch?.reduce(
      (sum, sb) => sum + parseFloat(sb.stock || 0),
      0
    ) || 0;
    return formatDecimal(total);
  };

  // Render stock by branch tooltip
  const renderStockTooltip = (item) => {
    const branches = item.stock_by_branch || [];

    return (
      <Tooltip id={`stock-tooltip-${item.id}`}>
        <div className="text-start" style={{ fontSize: '0.95rem', lineHeight: '1.35' }}>
          <div className="fw-semibold mb-1">Stock por sede</div>
          {branches.length > 0 ? (
            branches.map((sb) => (
              <div key={sb.branch_id}>
                <strong>{sb.branch_name}:</strong> {formatDecimal(sb.stock)} {item.unit}
              </div>
            ))
          ) : (
            <div>Sin stock en sedes</div>
          )}
        </div>
      </Tooltip>
    );
  };

  const handleDetailsClick = (itemId) => {
    navigate(`/inventory/items/${itemId}`);
  };

  if (loading) {
    return (
      <div className="text-center py-5">
        <Spinner animation="border" role="status">
          <span className="visually-hidden">Loading...</span>
        </Spinner>
      </div>
    );
  }

  if (error) {
    return (
      <Alert variant="danger">
        {error}
      </Alert>
    );
  }

  return (
    <div className="mb-5">
      <div className="border rounded p-3 mb-3 bg-light">
        <Row className="g-3 align-items-end">
          <Col md={4}>
            <Form.Group>
              <Form.Label>Buscar</Form.Label>
              <Form.Control
                type="text"
                name="search"
                placeholder="Nombre, SKU o marca"
                value={filters.search}
                onChange={handleFilterChange}
                style={inputControlStyle}
              />
            </Form.Group>
          </Col>

          <Col md={2}>
            <Form.Group>
              <Form.Label>Activo</Form.Label>
              <Form.Select name="is_active" value={filters.is_active} onChange={handleFilterChange} style={selectControlStyle}>
                <option value="">Todos</option>
                <option value="true">Activos</option>
                <option value="false">Inactivos</option>
              </Form.Select>
            </Form.Group>
          </Col>

          <Col md={3}>
            <Form.Group>
              <Form.Label>Categoría</Form.Label>
              <Form.Select
                name="category_id"
                value={filters.category_id}
                onChange={handleFilterChange}
                disabled={loadingCategories}
                style={selectControlStyle}
              >
                <option value="">Todas</option>
                {categories.map((category) => (
                  <option key={category.id} value={category.id}>
                    {category.name}
                  </option>
                ))}
              </Form.Select>
            </Form.Group>
          </Col>

          <Col md={3}>
            <Form.Group>
              <Form.Label>Unidad</Form.Label>
              <Form.Select name="unit" value={filters.unit} onChange={handleFilterChange} style={selectControlStyle}>
                <option value="">Todas</option>
                <option value="ud">Unidades</option>
                <option value="kg">Kilogramos</option>
                <option value="g">Gramos</option>
                <option value="l">Litros</option>
                <option value="ml">Mililitros</option>
                <option value="m">Metros</option>
                <option value="box">Cajas</option>
                <option value="pack">Packs</option>
              </Form.Select>
            </Form.Group>
          </Col>

          <Col md={3}>
            <Form.Group>
              <Form.Label>Ordenar por</Form.Label>
              <Form.Select name="order_by" value={filters.order_by} onChange={handleFilterChange} style={selectControlStyle}>
                <option value="created_at">Fecha creación</option>
                <option value="name">Nombre</option>
                <option value="sku">SKU</option>
                <option value="price">Precio</option>
                <option value="stock">Stock</option>
              </Form.Select>
            </Form.Group>
          </Col>

          <Col md={2}>
            <Form.Group>
              <Form.Label>Dirección</Form.Label>
              <Form.Select name="order_desc" value={filters.order_desc} onChange={handleFilterChange} style={selectControlStyle}>
                <option value="true">Descendente</option>
                <option value="false">Ascendente</option>
              </Form.Select>
            </Form.Group>
          </Col>

          <Col md={3} className="d-flex gap-2 align-items-end">
            <Button variant="primary" onClick={handleApplyFilters} style={filterButtonStyle}>
              Aplicar
            </Button>
            <Button variant="outline-secondary" onClick={handleResetFilters} style={filterButtonStyle}>
              Limpiar
            </Button>
          </Col>
        </Row>
      </div>

      <p className="text-muted">
        Mostrando {items.length} de {pagination.total} artículos
      </p>
      <div className="table-responsive">
        <table className="table table-hover align-middle">
          <thead>
            <tr>
              <th>Nombre</th>
              <th>SKU</th>
              <th className="text-center">Stock en sede</th>
              <th className="text-center">Stock total</th>
              <th className="text-center">Marca</th>
              <th className="text-center">Precio</th>
              <th className="text-center">Activo</th>
              <th className="text-center">Acciones</th>
            </tr>
          </thead>
          <tbody>
            {items.length === 0 ? (
              <tr>
                <td colSpan="8" className="text-center text-muted py-4">
                  No hay artículos disponibles
                </td>
              </tr>
            ) : (
              items.map((item) => (
                <tr key={item.id}>
                  <td>{item.name}</td>
                  <td>
                    <code>{item.sku}</code>
                  </td>
                  <td className="text-center">
                    {getBranchStock(item)} {item.unit}
                  </td>
                  <td className="text-center">
                    <OverlayTrigger trigger={['hover', 'focus']} placement="top" overlay={renderStockTooltip(item)}>
                      <span style={{ textDecoration: 'underline dotted' }}>
                        {getTotalStock(item)} {item.unit}
                      </span>
                    </OverlayTrigger>
                  </td>
                  <td className="text-center">{item.brand || '-'}</td>
                  <td className="text-center">{formatPrice(item.price)}</td>
                  <td className="text-center">
                    {item.is_active ? (
                      <span className="badge bg-success">Activo</span>
                    ) : (
                      <span className="badge bg-secondary">Inactivo</span>
                    )}
                  </td>
                  <td className="text-center">
                    <Button
                      variant="primary"
                      size="sm"
                      onClick={() => handleDetailsClick(item.id)}
                      style={{ width: '80px', height: '32px', padding: '0.25rem 0.5rem' }}
                    >
                      Detalles
                    </Button>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      <div className="d-flex flex-wrap align-items-center gap-2 mt-3">
        <div className="d-flex align-items-center gap-2">
          <span className="text-muted">Elementos por página</span>
          <Form.Select
            value={pageSize}
            onChange={handlePageSizeChange}
            style={{ width: '92px', height: '38px' }}
          >
            <option value={1}>1</option>
            <option value={5}>5</option>
            <option value={10}>10</option>
            <option value={20}>20</option>
            <option value={50}>50</option>
            <option value={100}>100</option>
          </Form.Select>
        </div>

        <div className="w-100 d-flex justify-content-center align-items-center gap-2">
          <Button
            variant="outline-secondary"
            size="sm"
            onClick={() => handlePageChange(1)}
            disabled={(pagination?.page || 1) <= 1 || loading}
            style={pageButtonStyle}
          >
            «
          </Button>

          <Button
            variant="outline-secondary"
            size="sm"
            onClick={() => handlePageChange((pagination?.page || 1) - 1)}
            disabled={(pagination?.page || 1) <= 1 || loading}
            style={pageButtonStyle}
          >
            ‹
          </Button>

          {getVisiblePages().map((pageNumber) => (
            <Button
              key={pageNumber}
              variant={pageNumber === (pagination?.page || 1) ? 'primary' : 'outline-secondary'}
              size="sm"
              onClick={() => handlePageChange(pageNumber)}
              disabled={loading}
              style={pageNumber === (pagination?.page || 1) ? currentPageButtonStyle : pageButtonStyle}
            >
              {pageNumber}
            </Button>
          ))}

          <Button
            variant="outline-secondary"
            size="sm"
            onClick={() => handlePageChange((pagination?.page || 1) + 1)}
            disabled={(pagination?.page || 1) >= (pagination?.totalPages || 1) || loading}
            style={pageButtonStyle}
          >
            ›
          </Button>

          <Button
            variant="outline-secondary"
            size="sm"
            onClick={() => handlePageChange(pagination?.totalPages || 1)}
            disabled={(pagination?.page || 1) >= (pagination?.totalPages || 1) || loading}
            style={pageButtonStyle}
          >
            »
          </Button>
        </div>
      </div>
    </div>
  );
};
