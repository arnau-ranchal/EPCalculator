#ifndef DATABASE_H
#define DATABASE_H

#include <mysql/mysql.h>
#include <string>
#include <stdexcept>

// Structure to hold query results
struct ItemResult {
    double e0;
    double optimal_rho;
};

/**
 * Establishes MySQL database connection using environment variables
 *
 * @return MYSQL* Database connection handle
 * @throws std::runtime_error if connection fails
 */
MYSQL* connectToDatabase();

/**
 * Creates a new table in the database
 *
 * @param connection MySQL database connection
 * @param tableName Name of the table to create
 * @return true if table was created successfully
 * @throws std::runtime_error on SQL errors
 */
bool createTable(MYSQL* connection, const std::string& tableName);

/**
 * Inserts or replaces an item in the database
 *
 * @param connection MySQL database connection
 * @param tableName Table to modify
 * @param date Date string in YYYY-MM-DD format
 * @param e0 Error value 0
 * @param optimal_rho Optimal rho value
 * @param M M parameter
 * @param const_type Constellation type string
 * @param snr Signal-to-noise ratio
 * @param r R parameter
 * @param n N parameter
 * @return true if operation succeeded
 * @throws std::runtime_error on SQL errors
 */
bool putItem(MYSQL* connection,
             const std::string& tableName,
             const std::string& date,
             double e0,
             double optimal_rho,
             int M,
             const std::string& const_type,
             double snr,
             double r,
             int n);

/**
 * Retrieves an item from the database
 *
 * @param connection MySQL database connection
 * @param tableName Table to query
 * @param M M parameter
 * @param const_type Constellation type string
 * @param snr Signal-to-noise ratio
 * @param r R parameter
 * @param n N parameter
 * @return ItemResult containing e0 and optimal_rho values
 * @throws std::runtime_error if item not found or query fails
 */
ItemResult getItem(MYSQL* connection,
                   const std::string& tableName,
                   int M,
                   const std::string& const_type,
                   double snr,
                   double r,
                   int n);

#endif // DATABASE_H