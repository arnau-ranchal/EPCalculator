#include <iostream>
#include <iomanip>
#include "functions.h"

using namespace std;

int main() {
    cout << fixed << setprecision(10);
    
    // Test case: SNR=5, N=15
    setN(15);
    setMod(2, "PAM");
    setSNR(5.0);
    setR(0.5);
    setQ();
    setPI();
    setW();
    
    double grad_rho, E0;
    
    cout << "Testing E_0_co directly:" << endl;
    
    double rho = 0.5;
    double result = E_0_co(0.5, rho, grad_rho, E0);
    cout << "rho=" << rho << ": E0=" << E0 << ", grad=" << grad_rho << ", return=" << result << endl;
    
    rho = 1.0;
    result = E_0_co(0.5, rho, grad_rho, E0);
    cout << "rho=" << rho << ": E0=" << E0 << ", grad=" << grad_rho << ", return=" << result << endl;
    
    return 0;
}
