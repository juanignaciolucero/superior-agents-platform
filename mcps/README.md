# Superior Agents Platform - MCPs

Este directorio contiene las implementaciones reales de **Model Context Protocol (MCP)** servers para Superior Agents Platform.

## 🚀 MCPs Disponibles

### 1. **💰 Wallet MCP** (`wallet-mcp/`)
**Funcionalidad de wallet y portfolio blockchain**
- ✅ `get_balance()` - Balance actual de wallet
- ✅ `get_transactions()` - Historial de transacciones  
- ✅ `watch_address()` - Monitoreo de direcciones
- ✅ `get_portfolio_value()` - Análisis de portfolio
- ✅ `validate_address()` - Validación de direcciones

**Redes soportadas:** Ethereum, Polygon, BSC

### 2. **📈 Price MCP** (`price-mcp/`)
**API de precios de criptomonedas con CoinGecko**
- ✅ `get_price()` - Precio actual de crypto
- ✅ `get_historical_prices()` - Precios históricos
- ✅ `get_market_data()` - Datos completos de mercado
- ✅ `search_coins()` - Buscar criptomonedas
- ✅ `get_trending()` - Cryptos trending

### 3. **📰 News MCP** (`news-mcp/`)
**Agregador de noticias crypto**
- ✅ `get_latest_news()` - Últimas noticias
- ✅ `search_news()` - Buscar por keywords
- ✅ `get_breaking_news()` - Breaking news
- ✅ `analyze_sentiment()` - Análisis de sentimiento
- ✅ `get_sources()` - Fuentes disponibles

**Fuentes:** CoinDesk, CoinTelegraph, Decrypt, The Block, Bitcoin Magazine

## 📦 Instalación

### Opción 1: Script automático
```bash
cd mcps
./install.sh
```

### Opción 2: Manual
```bash
cd mcps
python3 -m venv venv
source venv/bin/activate

# Instalar cada MCP
cd price-mcp && pip install -r requirements.txt && cd ..
cd news-mcp && pip install -r requirements.txt && cd ..  
cd wallet-mcp && pip install -r requirements.txt && cd ..
```

## 🔧 Uso Individual

### Probar Price MCP
```bash
source venv/bin/activate
python3 price-mcp/server.py
```

### Probar News MCP  
```bash
source venv/bin/activate
python3 news-mcp/server.py
```

### Probar Wallet MCP
```bash
source venv/bin/activate
python3 wallet-mcp/server.py
```

## 🏗️ Integración con Superior Agents

Los MCPs se integran automáticamente cuando:

1. **Crear un agente** en el dashboard
2. **Seleccionar MCPs** en el configurador
3. **Deploy del agente** - Los MCPs se ejecutan como subprocesos

### Configuración Automática

El sistema automáticamente:
- ✅ Spawns MCPs como subprocesos Python
- ✅ Configura comunicación via stdio
- ✅ Maneja errores y reconexiones
- ✅ Cache de respuestas para performance

## 🛠️ Desarrollo

### Estructura de un MCP
```python
from mcp.server import Server
import mcp.server.stdio
import mcp.types as types

server = Server("my-mcp")

@server.list_tools()
async def handle_list_tools():
    return [Tool(...)]

@server.call_tool()  
async def handle_call_tool(name, arguments):
    return [types.TextContent(...)]

async def main():
    async with mcp.server.stdio.stdio_server() as (read_stream, write_stream):
        await server.run(read_stream, write_stream, server.create_initialization_options())
```

### Agregar un nuevo MCP

1. **Crear directorio**: `mkdir my-new-mcp`
2. **Implementar server.py** siguiendo el patrón
3. **Crear requirements.txt** con dependencias
4. **Actualizar mcpCatalog.js** en el backend
5. **Probar integración** en el dashboard

## 📚 Referencias

- [Model Context Protocol Spec](https://modelcontextprotocol.io/)
- [MCP Python SDK](https://github.com/modelcontextprotocol/python-sdk)
- [Superior Agents Platform](../README.md)

## 🐛 Troubleshooting

### Error: "Module not found"
```bash
# Asegúrate de activar el virtual environment
source mcps/venv/bin/activate
```

### Error: "Permission denied"
```bash
# Hacer executable el script de instalación
chmod +x install.sh
```

### Error: "Connection refused"
```bash
# Verificar que Python 3.8+ esté instalado
python3 --version
```

## 🔒 Seguridad

- ✅ **Sin claves privadas**: Los MCPs nunca manejan private keys
- ✅ **Read-only**: Solo lectura de datos blockchain
- ✅ **Rate limiting**: APIs con cache para evitar límites
- ✅ **Sandboxing**: MCPs corren en procesos separados

---

**🎯 Los MCPs están listos para usar en Superior Agents Platform!**