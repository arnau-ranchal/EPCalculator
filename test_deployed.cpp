#include <iostream>
#include <iomanip>
#include "functions.h"

using namespace std;

int main() {
    cout << fixed << setprecision(10);
    
    // Test case 1: Low SNR (should work in all versions)
    setN(15);
    setMod(2, "PAM");
    setSNR(5.0);
    setR(0.5);
    setQ();
    setPI();
    setW();
    
    double r = 0.5, rho = 1.0, rho_interp = 0.0;
    double e0 = GD_iid(r, rho, rho_interp, 20, 15, 1e-6);
    cout << "Test 1 (SNR=5, N=15): E0=" << e0 << ", rho=" << rho << endl;
    
    // Test case 2: High SNR (fails in old versions)
    setN(30);
    setMod(2, "PAM");
    setSNR(50.0);
    setR(0.5);
    setQ();
    setPI();
    setW();
    
    r = 0.5; rho = 1.0; rho_interp = 0.0;
    e0 = GD_iid(r, rho, rho_interp, 20, 30, 1e-6);
    cout << "Test 2 (SNR=50, N=30): E0=" << e0 << ", rho=" << rho << endl;
    
    // Test case 3: Very High SNR (definitely fails in old versions)
    setN(30);
    setMod(2, "PAM");
    setSNR(90.0);
    setR(0.5);
    setQ();
    setPI();
    setW();
    
    r = 0.5; rho = 1.0; rho_interp = 0.0;
    e0 = GD_iid(r, rho, rho_interp, 20, 30, 1e-6);
    cout << "Test 3 (SNR=90, N=30): E0=" << e0 << ", rho=" << rho << endl;
    
    return 0;
}
