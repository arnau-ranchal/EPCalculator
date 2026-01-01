#include <iostream>
#include <iomanip>
#include "hermite.h"
#include "exponents/functions_clean_old.cpp"

using namespace std;

int main() {
    // Setup
    setN(30);
    setMod(2, "PAM");
    setSNR(50.0);
    setR(0.5);
    setQ();
    setPI();
    setW();
    
    cout << fixed << setprecision(10);
    
    // Test E_0_co at different rho values
    double grad_rho, E0;
    
    cout << "\n=== Testing E_0_co directly included (SNR=50, N=30) ===" << endl;
    
    double test_rho = 0.5;
    double result = E_0_co(0.5, test_rho, grad_rho, E0);
    cout << "rho=" << test_rho << ": E0=" << E0 << ", grad=" << grad_rho << ", return=" << result << endl;
    
    test_rho = 1.0;
    result = E_0_co(0.5, test_rho, grad_rho, E0);
    cout << "rho=" << test_rho << ": E0=" << E0 << ", grad=" << grad_rho << ", return=" << result << endl;
    
    return 0;
}
