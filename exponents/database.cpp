#include "database.h"
#include <cstdlib>
#include <iostream>
#include <iomanip>
#include <sstream>


MYSQL* connectToDatabase() {
    // Get environment variables from Docker MySQL image
    const char* db_host = std::getenv("MYSQL_HOST");
    const char* db_user = std::getenv("MYSQL_USER");
    const char* db_pass = std::getenv("MYSQL_PASSWORD");
    const char* db_name = std::getenv("MYSQL_DATABASE");

    // Fallback to root if no user specified
    if (!db_user) db_user = "root";
    if (!db_pass) db_pass = std::getenv("MYSQL_ROOT_PASSWORD");

    // Default to service name "mysql" if no host specified
    if (!db_host) db_host = "mysql";
    if (!db_name) db_name = "simulations";

    if (!db_pass) {
        throw std::runtime_error("Missing MySQL password in environment variables");
    }

    MYSQL* connection = mysql_init(nullptr);
    if (!connection) {
        throw std::runtime_error("MySQL initialization failed");
    }

    // Set connection timeout to 5 seconds
    unsigned int timeout = 5;
    mysql_options(connection, MYSQL_OPT_CONNECT_TIMEOUT, &timeout);

    if (!mysql_real_connect(
        connection,
        db_host,
        db_user,
        db_pass,
        db_name,
        0,  // port (default 3306)
        nullptr,  // unix_socket
        CLIENT_FOUND_ROWS  // client_flag
    )) {
        std::string error = "MySQL connection failed: ";
        error += mysql_error(connection);
        mysql_close(connection);
        throw std::runtime_error(error);
    }

    // Verify connection
    if (mysql_ping(connection) {
        std::string error = "Connection test failed: ";
        error += mysql_error(connection);
        mysql_close(connection);
        throw std::runtime_error(error);
    }

    return connection;
}

bool createTable(MYSQL* connection, const std::string& tableName) {
    std::string sql =
        "CREATE TABLE IF NOT EXISTS " + tableName + " ("
        "  id VARCHAR(255) NOT NULL PRIMARY KEY,"
        "  date DATE NOT NULL,"
        "  e0 DOUBLE NOT NULL,"
        "  optimal_rho DOUBLE NOT NULL,"
        "  M INT NOT NULL,"
        "  constel VARCHAR(50) NOT NULL,"
        "  snr DOUBLE NOT NULL,"
        "  r DOUBLE NOT NULL,"
        "  n INT NOT NULL,"
        "  INDEX idx_composite (M, constel, snr, r, n)"
        ") ENGINE=InnoDB DEFAULT CHARSET=utf8mb4";

    if (mysql_query(connection, sql.c_str())) {
        std::string error = "Create table failed: ";
        error += mysql_error(connection);
        throw std::runtime_error(error);
    }

    std::cout << "Table '" << tableName << "' created or exists" << std::endl;
    return true;
}

bool putItem(MYSQL* connection,
             const std::string& tableName,
             const std::string& date,
             double e0,
             double optimal_rho,
             int M,
             const std::string& const_type,
             double snr,
             double r,
             int n) {

    auto formatKey = [](double value) {
        std::ostringstream oss;
        oss << std::fixed << std::setprecision(2) << value;
        return oss.str();
    };

    std::string id = std::to_string(M) + "_" + const_type + "_"
                   + formatKey(snr) + "_" + formatKey(r) + "_"
                   + std::to_string(n);

    std::string sql =
        "INSERT INTO " + tableName + " "
        "(id, date, e0, optimal_rho, M, constel, snr, r, n) "
        "VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?) "
        "ON DUPLICATE KEY UPDATE "
        "date = VALUES(date), "
        "e0 = VALUES(e0), "
        "optimal_rho = VALUES(optimal_rho)";

    MYSQL_STMT* stmt = mysql_stmt_init(connection);
    if (!stmt) {
        throw std::runtime_error("Statement initialization failed");
    }

    if (mysql_stmt_prepare(stmt, sql.c_str(), sql.length())) {
        std::string error = "Prepare failed: ";
        error += mysql_stmt_error(stmt);
        mysql_stmt_close(stmt);
        throw std::runtime_error(error);
    }

    // Bind parameters
    MYSQL_BIND bind[9];
    memset(bind, 0, sizeof(bind));

    std::string id_str = id;
    std::string date_str = date;
    std::string const_str = const_type;
    std::string snr_str = formatKey(snr);
    std::string r_str = formatKey(r);

    // id (string)
    bind[0].buffer_type = MYSQL_TYPE_STRING;
    bind[0].buffer = (void*)id_str.c_str();
    bind[0].buffer_length = id_str.length();

    // date (string)
    bind[1].buffer_type = MYSQL_TYPE_STRING;
    bind[1].buffer = (void*)date_str.c_str();
    bind[1].buffer_length = date_str.length();

    // e0 (double)
    bind[2].buffer_type = MYSQL_TYPE_DOUBLE;
    bind[2].buffer = (void*)&e0;

    // optimal_rho (double)
    bind[3].buffer_type = MYSQL_TYPE_DOUBLE;
    bind[3].buffer = (void*)&optimal_rho;

    // M (int)
    bind[4].buffer_type = MYSQL_TYPE_LONG;
    bind[4].buffer = (void*)&M;

    // constel (string)
    bind[5].buffer_type = MYSQL_TYPE_STRING;
    bind[5].buffer = (void*)const_str.c_str();
    bind[5].buffer_length = const_str.length();

    // snr (double as string)
    bind[6].buffer_type = MYSQL_TYPE_STRING;
    bind[6].buffer = (void*)snr_str.c_str();
    bind[6].buffer_length = snr_str.length();

    // r (double as string)
    bind[7].buffer_type = MYSQL_TYPE_STRING;
    bind[7].buffer = (void*)r_str.c_str();
    bind[7].buffer_length = r_str.length();

    // n (int)
    bind[8].buffer_type = MYSQL_TYPE_LONG;
    bind[8].buffer = (void*)&n;

    if (mysql_stmt_bind_param(stmt, bind)) {
        std::string error = "Bind failed: ";
        error += mysql_stmt_error(stmt);
        mysql_stmt_close(stmt);
        throw std::runtime_error(error);
    }

    if (mysql_stmt_execute(stmt)) {
        std::string error = "Execute failed: ";
        error += mysql_stmt_error(stmt);
        mysql_stmt_close(stmt);
        throw std::runtime_error(error);
    }

    mysql_stmt_close(stmt);
    return true;
}

ItemResult getItem(MYSQL* connection,
                   const std::string& tableName,
                   int M,
                   const std::string& const_type,
                   double snr,
                   double r,
                   int n) {

    auto formatKey = [](double value) {
        std::ostringstream oss;
        oss << std::fixed << std::setprecision(2) << value;
        return oss.str();
    };

    std::string id = std::to_string(M) + "_" + const_type + "_"
                   + formatKey(snr) + "_" + formatKey(r) + "_"
                   + std::to_string(n);

    std::string sql =
        "SELECT e0, optimal_rho FROM " + tableName + " "
        "WHERE id = ?";

    MYSQL_STMT* stmt = mysql_stmt_init(connection);
    if (!stmt) {
        throw std::runtime_error("Statement initialization failed");
    }

    if (mysql_stmt_prepare(stmt, sql.c_str(), sql.length())) {
        std::string error = "Prepare failed: ";
        error += mysql_stmt_error(stmt);
        mysql_stmt_close(stmt);
        throw std::runtime_error(error);
    }

    // Bind parameter
    MYSQL_BIND param_bind;
    memset(&param_bind, 0, sizeof(param_bind));

    param_bind.buffer_type = MYSQL_TYPE_STRING;
    param_bind.buffer = (void*)id.c_str();
    param_bind.buffer_length = id.length();

    if (mysql_stmt_bind_param(stmt, &param_bind)) {
        std::string error = "Bind param failed: ";
        error += mysql_stmt_error(stmt);
        mysql_stmt_close(stmt);
        throw std::runtime_error(error);
    }

    // Bind results
    ItemResult result{-1.0, -1.0};
    MYSQL_BIND result_bind[2];
    memset(result_bind, 0, sizeof(result_bind));

    result_bind[0].buffer_type = MYSQL_TYPE_DOUBLE;
    result_bind[0].buffer = &result.e0;

    result_bind[1].buffer_type = MYSQL_TYPE_DOUBLE;
    result_bind[1].buffer = &result.optimal_rho;

    if (mysql_stmt_bind_result(stmt, result_bind)) {
        std::string error = "Bind result failed: ";
        error += mysql_stmt_error(stmt);
        mysql_stmt_close(stmt);
        throw std::runtime_error(error);
    }

    if (mysql_stmt_execute(stmt)) {
        std::string error = "Execute failed: ";
        error += mysql_stmt_error(stmt);
        mysql_stmt_close(stmt);
        throw std::runtime_error(error);
    }

    if (mysql_stmt_fetch(stmt) != 0) {
        mysql_stmt_close(stmt);
        throw std::runtime_error("Item not found");
    }

    mysql_stmt_close(stmt);
    return result;
}